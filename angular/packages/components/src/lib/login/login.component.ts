import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  input,
  linkedSignal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@workern/services';
import { SnackbarService } from '@workern/services';
import { GlobalManagerService } from '@workern/services';
import { GtagService } from '@workern/services';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmInputImports } from '@spartan/components/input';
import { HlmLabelImports } from '@spartan/components/label';
import { HlmSpinnerImports } from '@spartan/components/spinner';
import { HlmInputOtpImports } from '@spartan/components/input-otp';
import { HlmCardImports } from '@spartan/components/card';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { BrnInputOtpImports } from '@spartan-ng/brain/input-otp';
import { WorkernPhoneInputComponent } from '../workern-phone-input/workern-phone-input.component';
import {
  COUNTRY_DIAL_CODES,
  CountryDialCode,
  DEFAULT_COUNTRY
} from './country-codes.data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSpinnerImports,
    HlmInputOtpImports,
    HlmCardImports,
    HlmSeparatorImports,
    BrnInputOtpImports,
    WorkernPhoneInputComponent,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  gms = inject(GlobalManagerService);

  loginSuccess = output<void>();
  logoSrc = input<string>('assets/icons/icon-72x72.png');
  fullPage = input<boolean>(true);
  protected readonly resolvedFullPage = computed(() => this.fullPage() ?? true);
  brandQuote = input<string>('');
  brandAuthor = input<string>('');
  disableAutoNavigate = input<boolean>(false);
  /** Hide the logo/title header in embedded mode (fullPage=false) */
  hideEmbeddedHeader = input<boolean>(false);
  /** Short tagline shown in left panel center + right panel subtitle */
  appTagline = input<string>('');
  /** Feature bullet points shown in the left panel */
  features = input<string[]>([]);
  /** Control which auth methods are visible */
  allowedMethods = input<Array<'google' | 'phone' | 'email'>>([
    'google',
    'phone',
    'email'
  ]);
  protected readonly resolvedMethods = computed(
    () => this.allowedMethods() ?? ['google', 'phone', 'email']
  );
  /** Optional URL the top-left logo/name links to (e.g. landing page) */
  logoHref = input<string>('');
  /** Subtitle shown below the sign-in heading (each app can customise this) */
  subtitle = input<string>('Sign in to get started.');
  /** URL for Terms of Service link */
  termsUrl = input<string>('/terms-and-conditions');
  /** URL for Privacy Policy link */
  privacyUrl = input<string>('/privacy-policy');

  private authService = inject(AuthService);
  private snackbarService = inject(SnackbarService);
  private gtagService = inject(GtagService);

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  appName = this.gms.appDisplayName;
  private returnUrl = linkedSignal(() => this.gms.config().initialReturnUrl);

  @ViewChild('recaptchaContainer')
  recaptchaContainer!: ElementRef<HTMLDivElement>;

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

  phoneForm = this.fb.group({
    phone: ['', [Validators.required]]
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

  loginStatus = signal('not_started');

  async loginWithGoogle() {
    this.loginStatus.set('in-progress');
    this.selectedMethod.set('google');
    this.isLoading.set(true);

    try {
      await this.authService.loginWithGoogleProvider();
      this.gtagService.sendEvent('sign_in_complete', {
        auth_method: 'google',
        app: this.appName()
      });
      this.loginSuccess.emit();
      this.navigateAfterLogin();
    } catch (error) {
      console.error('Google login failed:', error);
      this.snackbarService.error('Google login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  showPhoneForm() {
    this.showingEmailForm.set(false);
    this.showingPhoneForm.set(true);
  }

  selectCountry(country: CountryDialCode) {
    this.selectedCountry.set(country);
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
    this.phoneForm.get('phone')!.enable({ emitEvent: false });
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
    if (this.phoneForm.get('phone')!.invalid) return;
    this.loginStatus.set('in-progress');
    this.selectedMethod.set('phone');
    this.isLoading.set(true);
    this.phoneForm.get('phone')!.disable({ emitEvent: false });

    try {
      const phoneNumber = this.phoneForm.getRawValue().phone!;
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
      this.snackbarService.error('Failed to send OTP. Please try again.');
      this.phoneForm.get('phone')!.enable({ emitEvent: false });
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  async verifyOTP() {
    if (this.otpForm.get('otp')!.invalid) return;

    this.selectedMethod.set('otp');
    this.isLoading.set(true);

    try {
      const otp = this.otpForm.get('otp')!.value!;
      await this.authService.verifyOTP(otp);

      this.gtagService.sendEvent('sign_in_complete', {
        auth_method: 'phone_otp',
        app: this.appName()
      });
      this.loginSuccess.emit();
      this.navigateAfterLogin();
    } catch (error) {
      console.error('OTP verification failed:', error);
      this.snackbarService.error('Invalid OTP. Please try again.');
    } finally {
      this.isLoading.set(false);
      this.selectedMethod.set(null);
    }
  }

  resendOTP() {
    // Reset forms and go back to phone number entry
    this.otpSent.set(false);
    this.showingOTPForm.set(false);
    this.showingPhoneForm.set(true);
    this.otpForm.reset();
    this.phoneForm.get('phone')!.enable({ emitEvent: false });
  }

  goBackToPhone() {
    this.showingOTPForm.set(false);
    this.showingPhoneForm.set(true);
    this.otpForm.reset();
  }

  ngOnInit() {
    // Get returnUrl from query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.returnUrl.set(returnUrl);
    }

    // Auto-submit OTP when all 6 digits are entered
    this.otpForm.get('otp')!.valueChanges.subscribe((value) => {
      if (value?.length === 6 && this.otpForm.get('otp')!.valid) {
        this.verifyOTP();
      }
    });

    // Auto-send OTP for fixed-length countries when the expected digit count is reached
    this.phoneForm.get('phone')!.valueChanges.subscribe((value) => {
      const country = this.selectedCountry();
      if (
        country.isFixedLength &&
        country.mobileLength !== undefined &&
        value?.length === country.mobileLength &&
        this.phoneForm.get('phone')!.valid
      ) {
        this.loginWithPhone();
      }
    });
  }

  async loginWithEmail() {
    if (this.emailForm.invalid) return;

    this.selectedMethod.set('email');
    this.isLoading.set(true);

    try {
      const { name, email, password } = this.emailForm.value;
      const isSignup = this.emailMode() === 'signup';

      if (isSignup) {
        await this.authService.signUpWithEmail(email!, password!, name!);
        this.gtagService.sendEvent('sign_up_complete', {
          auth_method: 'email',
          app: this.appName()
        });
      } else {
        await this.authService.signInWithEmail(email!, password!);
        this.gtagService.sendEvent('sign_in_complete', {
          auth_method: 'email',
          app: this.appName()
        });
      }

      this.loginSuccess.emit();
      this.navigateAfterLogin();
    } catch (error: any) {
      console.error('Email authentication failed:', error);
      this.snackbarService.error(
        error.message || 'Authentication failed. Please try again.'
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
        'Password reset email sent! Please check your inbox.'
      );
      this.goBackToEmailForm();
    } catch (error: any) {
      console.error('Password reset failed:', error);
      this.snackbarService.error(
        error.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async navigateAfterLogin() {
    if (this.disableAutoNavigate()) return;
    this.router.navigate([this.returnUrl()]);
  }
}
