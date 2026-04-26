import {
  Component,
  ChangeDetectionStrategy,
  output,
  input,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, GlobalManagerService } from '@workern/services';
import { SnackbarService } from '@workern/services';
import { HlmDialogImports, HlmDialogService } from '@spartan/components/dialog';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmInputImports } from '@spartan/components/input';
import { HlmLabelImports } from '@spartan/components/label';
import { HlmSpinnerImports } from '@spartan/components/spinner';
import { HlmInputOtpImports } from '@spartan/components/input-otp';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { BrnInputOtpImports } from '@spartan-ng/brain/input-otp';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  COUNTRY_DIAL_CODES,
  CountryDialCode,
  DEFAULT_COUNTRY
} from '../login/country-codes.data';

type LoginDialogContext = {
  onLoginSuccess: () => void;
  termsUrl?: string;
  privacyUrl?: string;
};

// ── Public wrapper component ──────────────────────────────────────────────────
// Callers: @if (show) { <wn-login-dialog (close)="..." (loginSuccess)="..." /> }
// The dialog is opened programmatically via HlmDialogService so the CDK overlay,
// backdrop, and z-index are all handled correctly out of the box.
@Component({
  selector: 'wn-login-dialog',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginDialogComponent implements OnInit {
  private translate = inject(TranslateService);
  readonly close = output<void>();
  readonly loginSuccess = output<void>();

  /** URL for Terms of Service page */
  readonly termsUrl = input<string>('#');
  /** URL for Privacy Policy page */
  readonly privacyUrl = input<string>('#');

  /** @deprecated Use close instead */
  readonly closed = this.close;
  /** @deprecated Use close instead */
  readonly closeDialog = this.close;

  private readonly _dialogService = inject(HlmDialogService);

  ngOnInit() {
    const dialogRef = this._dialogService.open(LoginDialogContentComponent, {
      context: {
        onLoginSuccess: () => this.loginSuccess.emit(),
        termsUrl: this.termsUrl(),
        privacyUrl: this.privacyUrl()
      } satisfies LoginDialogContext,
      contentClass: 'sm:max-w-md max-h-[90vh] overflow-y-auto'
    });

    dialogRef.closed$.subscribe(() => this.close.emit());
  }
}

// ── Dialog content component (private - only used via HlmDialogService) ────────
@Component({
  selector: 'wn-login-dialog-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmDialogImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSpinnerImports,
    HlmInputOtpImports,
    BrnInputOtpImports,
    TranslatePipe
  ],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss',
  host: {
    '(window:resize)': 'onWindowResize()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
class LoginDialogContentComponent {
  private translate = inject(TranslateService);
  private readonly _dialogRef = inject(BrnDialogRef);
  private readonly _context = injectBrnDialogContext<LoginDialogContext>();

  private authService = inject(AuthService);
  private globalManager = inject(GlobalManagerService);
  protected appName = this.globalManager.appDisplayName;
  private snackbarService = inject(SnackbarService);
  private fb = inject(FormBuilder);

  protected readonly termsUrl = signal(this._context.termsUrl ?? '#');
  protected readonly privacyUrl = signal(this._context.privacyUrl ?? '#');

  @ViewChild('recaptchaContainer')
  recaptchaContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('countryDropdownTrigger')
  countryDropdownTrigger?: ElementRef<HTMLButtonElement>;

  @ViewChild('countryDropdownPanel')
  countryDropdownPanel?: ElementRef<HTMLDivElement>;

  isLoading = signal(false);
  selectedMethod = signal<'google' | 'phone' | 'email' | 'otp' | null>(null);
  showingPhoneForm = signal(false);
  showingEmailForm = signal(false);
  showingOTPForm = signal(false);
  showingForgotPasswordForm = signal(false);
  otpSent = signal(false);
  emailMode = signal<'signin' | 'signup'>('signin');

  readonly countryCodes = COUNTRY_DIAL_CODES;
  selectedCountry = signal<CountryDialCode>(DEFAULT_COUNTRY);
  countrySearch = signal('');
  showCountryDropdown = signal(false);
  countryDropdownOpenUp = signal(true);

  filteredCountries = computed(() => {
    const query = this.countrySearch().toLowerCase();
    if (!query) return this.countryCodes;
    return this.countryCodes.filter(
      (c) => c.name.toLowerCase().includes(query) || c.dialCode.includes(query)
    );
  });

  phoneForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  emailForm = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  private _closeWithSuccess() {
    this._context.onLoginSuccess();
    this._dialogRef.close();
  }

  async loginWithGoogle() {
    this.selectedMethod.set('google');
    this.isLoading.set(true);

    try {
      await this.authService.loginWithGoogleProvider();
      this._closeWithSuccess();
    } catch (error) {
      console.error('Google login failed:', error);
      this.snackbarService.error(
        this.translate.instant('auth.googleLoginFailed')
      );
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  showPhoneForm() {
    this.showingEmailForm.set(false);
    this.showingPhoneForm.set(true);
  }

  toggleCountryDropdown() {
    const nextState = !this.showCountryDropdown();
    this.showCountryDropdown.set(nextState);

    if (!nextState) {
      return;
    }

    // Run after render so panel height is available for accurate placement.
    requestAnimationFrame(() => this.updateCountryDropdownPosition());
  }

  selectCountry(country: CountryDialCode) {
    this.selectedCountry.set(country);
    this.countrySearch.set('');
    this.showCountryDropdown.set(false);
  }

  showEmailForm() {
    this.showingPhoneForm.set(false);
    this.showingEmailForm.set(true);
    this.showingForgotPasswordForm.set(false);
    this.emailMode.set('signin');
    this.updateEmailFormValidation();
  }

  toggleEmailMode() {
    this.emailMode.set(this.emailMode() === 'signin' ? 'signup' : 'signin');
    this.updateEmailFormValidation();
  }

  showForgotPasswordForm() {
    this.showingEmailForm.set(false);
    this.showingForgotPasswordForm.set(true);
  }

  goBackToEmailForm() {
    this.showingForgotPasswordForm.set(false);
    this.showingEmailForm.set(true);
  }

  goBackToPhoneForm() {
    this.showingOTPForm.set(false);
    this.showingPhoneForm.set(true);
    this.otpForm.reset();
  }

  onWindowResize() {
    if (!this.showCountryDropdown()) {
      return;
    }

    this.updateCountryDropdownPosition();
  }

  private updateCountryDropdownPosition() {
    const triggerRect =
      this.countryDropdownTrigger?.nativeElement.getBoundingClientRect();

    if (!triggerRect) {
      this.countryDropdownOpenUp.set(true);
      return;
    }

    const panelHeight =
      this.countryDropdownPanel?.nativeElement.offsetHeight ?? 256;
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    const shouldOpenUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;

    this.countryDropdownOpenUp.set(shouldOpenUp);
  }

  private updateEmailFormValidation() {
    const nameControl = this.emailForm.get('name');

    if (this.emailMode() === 'signup') {
      nameControl?.setValidators([Validators.required]);
    } else {
      nameControl?.clearValidators();
    }

    nameControl?.updateValueAndValidity();
  }

  async loginWithPhone() {
    if (this.phoneForm.invalid) return;

    this.selectedMethod.set('phone');
    this.isLoading.set(true);

    try {
      const phoneNumber = this.phoneForm.value.phone!;
      const fullPhoneNumber = `${this.selectedCountry().dialCode}${phoneNumber}`;
      const result = await this.authService.loginWithPhoneNumber(
        fullPhoneNumber,
        this.recaptchaContainer.nativeElement
      );
      console.log('confirmation result', result);
      this.otpSent.set(true);
      this.showingOTPForm.set(true);
      this.showingPhoneForm.set(false);
    } catch (error) {
      console.error('Phone login failed:', error);
      this.snackbarService.error(
        this.translate.instant('auth.failedToSendOtp')
      );
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  async verifyOTP() {
    if (this.otpForm.invalid) return;

    this.selectedMethod.set('otp');
    this.isLoading.set(true);

    try {
      const otp = this.otpForm.value.otp!;
      await this.authService.verifyOTP(otp);
      this._closeWithSuccess();
    } catch (error) {
      console.error('OTP verification failed:', error);
      this.snackbarService.error(this.translate.instant('auth.invalidOtp'));
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  resendOTP() {
    this.otpSent.set(false);
    this.showingOTPForm.set(false);
    this.showingPhoneForm.set(true);
    this.otpForm.reset();
  }

  goBackToPhone() {
    this.showingOTPForm.set(false);
    this.showingPhoneForm.set(true);
    this.otpForm.reset();
  }

  async loginWithEmail() {
    if (this.emailForm.invalid) return;

    this.selectedMethod.set('email');
    this.isLoading.set(true);

    try {
      const { name, email, password } = this.emailForm.value;

      if (this.emailMode() === 'signup') {
        await this.authService.signUpWithEmail(email!, password!, name!);
      } else {
        await this.authService.signInWithEmail(email!, password!);
      }

      this._closeWithSuccess();
    } catch (error: any) {
      console.error('Email authentication failed:', error);
      this.snackbarService.error(
        error.message || this.translate.instant('auth.authenticationFailed')
      );
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  async resetPassword() {
    if (this.forgotPasswordForm.invalid) return;

    this.isLoading.set(true);

    try {
      const email = this.forgotPasswordForm.value.email!;
      await this.authService.resetPassword(email);

      this.snackbarService.success(
        this.translate.instant('auth.passwordResetEmailSent')
      );
      this.goBackToEmailForm();
    } catch (error: any) {
      console.error('Password reset failed:', error);
      this.snackbarService.error(
        error.message || this.translate.instant('auth.failedToSendResetEmail')
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
