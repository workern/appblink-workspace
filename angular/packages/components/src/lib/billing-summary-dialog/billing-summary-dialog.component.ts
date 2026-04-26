import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BillingService } from '@workern/services';
import { UserSubscription } from '@workern/models';
import { AmountDisplayPipe } from '@workern/pipes';

import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmCardImports } from '@spartan/components/card';
import { HlmDialogImports } from '@spartan/components/dialog';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmSkeletonImports } from '@spartan/components/skeleton';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';

import { PaymentDialog } from '../payment-dialog/payment-dialog';
import { BillingPageComponent } from '../billing-page/billing-page.component';

@Component({
  selector: 'wn-billing-summary-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AmountDisplayPipe,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmDialogImports,
    BrnDialogContent,
    HlmSeparatorImports,
    HlmSkeletonImports,
    PaymentDialog
  ],
  templateUrl: './billing-summary-dialog.component.html',
  styleUrl: './billing-summary-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingSummaryDialogComponent {
  private readonly billingService = inject(BillingService);

  /** Controls dialog visibility */
  readonly open = input(false);
  /** App ID; defaults to GlobalManagerService.spaceId() */
  readonly appId = input<string | undefined>(undefined);

  /** Emitted when dialog should close */
  readonly closed = output<void>();
  /** Emitted when user clicks "Manage Billing" — parent should navigate to billing page */
  readonly manageBilling = output<void>();
  /** Emitted after a successful checkout/upgrade */
  readonly upgraded = output<void>();

  protected readonly showUpgradeDialog = signal(false);

  private readonly subscription$ = toSignal<UserSubscription | null>(
    this.billingService.getActiveSubscription(this.appId())
  );

  protected readonly subscription = computed(() => this.subscription$());
  protected readonly isLoading = computed(
    () => this.subscription$() === undefined
  );

  protected readonly statusDisplay = computed(() =>
    BillingPageComponent.resolveStatusDisplay(this.subscription()?.status)
  );

  protected readonly daysUntilRenewal = computed(() => {
    const nextCharge =
      this.subscription()?.nextChargeAt ??
      this.subscription()?.currentPeriodEnd;
    if (!nextCharge) return null;
    const diff = new Date(nextCharge).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  protected close(): void {
    this.closed.emit();
  }

  protected onManageBilling(): void {
    this.close();
    this.manageBilling.emit();
  }

  protected openUpgrade(): void {
    this.showUpgradeDialog.set(true);
  }

  protected onUpgradeCompleted(): void {
    this.showUpgradeDialog.set(false);
    this.upgraded.emit();
    this.close();
  }
}
