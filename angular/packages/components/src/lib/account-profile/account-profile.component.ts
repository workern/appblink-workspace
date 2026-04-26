import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  FirebaseFunctionsService,
  SnackbarService
} from '@workern/services';
import { HlmCardImports } from '@spartan/components/card';
import { HlmAvatarImports } from '@spartan/components/avatar';
import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmAlertDialogImports } from '@spartan/components/alert-dialog';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmIcon } from '@spartan/components/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideExternalLink,
  lucideFileText,
  lucideLogOut,
  lucideShield,
  lucideStar,
  lucideTrash2,
  lucideUser
} from '@ng-icons/lucide';

@Component({
  selector: 'wn-account-profile',
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgIcon,
    HlmIcon,
    ...HlmCardImports,
    ...HlmAvatarImports,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmAlertDialogImports,
    ...HlmSeparatorImports
  ],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideExternalLink,
      lucideFileText,
      lucideLogOut,
      lucideShield,
      lucideStar,
      lucideTrash2,
      lucideUser
    })
  ]
})
export class AccountProfileComponent {
  /** Cloud Function name to call for account deletion e.g. 'savenest-account-deleteaccount' */
  readonly deleteAccountFnName = input.required<string>();
  /** Optional page title shown in the back-navigation header */
  readonly pageTitle = input<string>('Account');
  /** Whether the user is currently subscribed (shows PRO badge & manage button) */
  readonly isSubscribed = input<boolean>(false);
  /** Route to navigate to when user taps Upgrade / Manage Subscription */
  readonly upgradePath = input<string>('/billing');
  /** Privacy policy URL — when provided shows the Legal section */
  readonly privacyPolicyUrl = input<string>('');
  /** Terms of use URL — when provided shows the Legal section */
  readonly termsUrl = input<string>('');
  /** Subtitle shown under Delete Account row */
  readonly deleteAccountSubtitle = input<string>(
    'Permanently delete your account and all data'
  );
  /** Body text shown in the Delete Account confirmation dialog */
  readonly deleteAccountConfirmMessage = input<string>(
    'This will permanently delete your account and all saved data. This action cannot be undone.'
  );

  private readonly authService = inject(AuthService);
  private readonly functionsService = inject(FirebaseFunctionsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isDeletingAccount = signal(false);

  protected get initials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const name = user.name ?? user.email ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected get hasLegalLinks(): boolean {
    return !!(this.privacyPolicyUrl() || this.termsUrl());
  }

  protected goBack(): void {
    this.location.back();
  }

  protected navigateToUpgrade(): void {
    this.router.navigate([this.upgradePath()]);
  }

  protected openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected async signOut(): Promise<void> {
    await this.authService.logout();
  }

  protected async deleteAccount(): Promise<void> {
    this.isDeletingAccount.set(true);
    try {
      await this.functionsService.firebaseCall(this.deleteAccountFnName(), {
        acknowledged: true
      });
      // Auth state change will redirect automatically
    } catch (e: any) {
      this.isDeletingAccount.set(false);
      this.snackbar.error(
        e?.message ?? 'Failed to delete account. Please try again.'
      );
    }
  }
}
