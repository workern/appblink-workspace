import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BillingDialogPlanView,
  BillingService,
  BillingTransaction,
  LoadScriptsDynamicallyService,
  RazorpayService,
  SnackbarService
} from '@workern/services';
import {
  GatewayOrderCreationResult,
  TransactionProcessorID,
  UserSubscription
} from '@workern/models';
import { AmountDisplayPipe } from '@workern/pipes';

import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmCardImports } from '@spartan/components/card';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmSkeletonImports } from '@spartan/components/skeleton';
import { HlmTabsImports } from '@spartan/components/tabs';

import { PaymentDialog } from '../payment-dialog/payment-dialog';

export type SubscriptionStatusDisplay = {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  colorClass: string;
};

@Component({
  selector: 'wn-billing-page',
  standalone: true,
  imports: [
    CommonModule,
    AmountDisplayPipe,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSeparatorImports,
    HlmSkeletonImports,
    HlmTabsImports,
    PaymentDialog
  ],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingPageComponent {
  private readonly billingService = inject(BillingService);
  private readonly razorpayService = inject(RazorpayService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly loadScriptsService = inject(LoadScriptsDynamicallyService);
  private readonly location = inject(Location);

  private readonly preferredGateways: readonly TransactionProcessorID[] = [
    TransactionProcessorID.RAZORPAY,
    TransactionProcessorID.LEMON_SQUEEZY,
    TransactionProcessorID.DODO_PAYMENTS
  ];

  /** App ID — if omitted, falls back to GlobalManagerService.spaceId() */
  readonly appId = input<string | undefined>(undefined);
  /** App display name shown in headings */
  readonly appName = input('');

  protected readonly purchasingPlanId = signal<string | null>(null);
  protected readonly showUpgradeDialog = signal(false);
  protected readonly isCancelling = signal(false);
  protected readonly showCancelConfirm = signal(false);

  protected openUpgrade(): void {
    this.showUpgradeDialog.set(true);
  }
  protected closeUpgrade(): void {
    this.showUpgradeDialog.set(false);
  }

  protected async cancelSubscription(): Promise<void> {
    if (this.isCancelling()) return;
    const sub = this.subscription();
    if (!sub) return;
    this.isCancelling.set(true);
    this.showCancelConfirm.set(false);
    try {
      await this.billingService.cancelSubscription({
        productId: sub.id,
        appId: this.appId(),
        cancelAtCycleEnd: true
      });
      this.snackbarService.success(
        'Subscription will be cancelled at the end of the current billing period.'
      );
    } catch (err) {
      this.snackbarService.error(
        err instanceof Error
          ? err.message
          : 'Unable to cancel subscription. Please try again.'
      );
    } finally {
      this.isCancelling.set(false);
    }
  }

  // undefined = still loading (no value emitted yet); null = loaded, no subscription; object = active sub
  private readonly subscription$ = toSignal<
    UserSubscription | null | undefined
  >(this.billingService.getActiveSubscription(this.appId()));

  private readonly transactions$ = toSignal(
    this.billingService.getBillingTransactions(this.appId()),
    { initialValue: [] as BillingTransaction[] }
  );

  protected readonly subscription = computed(() => {
    const sub = this.subscription$() ?? null;
    // Treat a cancelled subscription the same as no subscription so plans are shown
    if (sub?.status === 'cancelled') return null;
    return sub;
  });
  protected readonly transactions = computed(() => this.transactions$() ?? []);
  protected readonly isLoadingSubscription = computed(
    () => this.subscription$() === undefined
  );

  // Fetch plans when there is no active subscription or it is cancelled
  private readonly plansResource = resource({
    params: () => ({
      showPlans:
        this.subscription$() === null ||
        this.subscription$()?.status === 'cancelled'
    }),
    loader: async ({ params }) => {
      if (!params.showPlans) return [] as BillingDialogPlanView[];
      const response = await this.billingService.getProductsForApp({
        includeInactive: false
      });
      return this.billingService.mapProductsToDialogPlans({
        products: response.products,
        preferredGateways: this.preferredGateways
      });
    }
  });

  protected readonly plans = computed(
    () => this.plansResource.value() ?? ([] as BillingDialogPlanView[])
  );
  protected readonly isLoadingPlans = this.plansResource.isLoading;
  protected readonly statusDisplay = computed<SubscriptionStatusDisplay>(() => {
    const status = this.subscription()?.status;
    return BillingPageComponent.resolveStatusDisplay(status);
  });

  protected readonly progressPercent = computed(() => {
    const sub = this.subscription();
    if (!sub?.currentPeriodStart || !sub?.currentPeriodEnd) return 0;
    const start = new Date(sub.currentPeriodStart).getTime();
    const end = new Date(sub.currentPeriodEnd).getTime();
    const now = Date.now();
    return Math.min(
      100,
      Math.max(0, Math.round(((now - start) / (end - start)) * 100))
    );
  });

  protected readonly daysUntilRenewal = computed(() => {
    const nextCharge =
      this.subscription()?.nextChargeAt ??
      this.subscription()?.currentPeriodEnd;
    if (!nextCharge) return null;
    const diff = new Date(nextCharge).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  protected goBack(): void {
    this.location.back();
  }

  protected async purchasePlan(plan: BillingDialogPlanView): Promise<void> {
    if (this.purchasingPlanId()) return;

    const metadata = plan.metadata as Record<string, unknown> | undefined;
    const productId =
      typeof metadata?.['productId'] === 'string'
        ? metadata['productId']
        : null;
    const entitlementId =
      typeof metadata?.['entitlementId'] === 'string'
        ? metadata['entitlementId']
        : null;
    const gatewayValue = metadata?.['gateway'];
    const gateway =
      typeof gatewayValue === 'string'
        ? (gatewayValue as TransactionProcessorID)
        : null;

    if (!productId || !entitlementId || !gateway) {
      this.snackbarService.error(
        'Unable to start checkout. Missing plan context.'
      );
      return;
    }

    this.purchasingPlanId.set(plan.id);
    try {
      const [response] = await Promise.all([
        this.billingService.createCheckoutSession({
          productId,
          entitlementId,
          gateway,
          quantity: 1
        }),
        this.loadGatewayScript(gateway)
      ]);
      const gatewayResult = response.gateway;

      if (gatewayResult.name === TransactionProcessorID.RAZORPAY) {
        this.razorpayService.payWithRazorpay(gatewayResult);
        return;
      }

      const checkoutUrl = this.resolveCheckoutUrl(gatewayResult);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      this.snackbarService.error('Unable to initialize payment gateway.');
    } catch (err) {
      this.snackbarService.error(
        err instanceof Error
          ? err.message
          : 'Unable to start payment. Please try again.'
      );
    } finally {
      this.purchasingPlanId.set(null);
    }
  }

  private async loadGatewayScript(
    gateway: TransactionProcessorID
  ): Promise<void> {
    switch (gateway) {
      case TransactionProcessorID.RAZORPAY:
        await this.loadScriptsService.loadRazorpay();
        break;
      case TransactionProcessorID.LEMON_SQUEEZY:
        await this.loadScriptsService.loadScript(
          'https://app.lemonsqueezy.com/js/lemon.js'
        );
        break;
    }
  }

  private resolveCheckoutUrl(
    gateway: GatewayOrderCreationResult
  ): string | null {
    const asRec = (v: unknown): Record<string, unknown> | null =>
      v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
    const paths = [
      ['data', 'checkoutUrl'],
      ['data', 'checkout_url'],
      ['data', 'paymentLink'],
      ['data', 'url'],
      ['data', 'attributes', 'url']
    ];
    for (const path of paths) {
      let cur: unknown = gateway;
      for (const seg of path) cur = asRec(cur)?.[seg];
      if (typeof cur === 'string') return cur;
    }
    return null;
  }

  protected formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected reasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      SUBSCRIPTION_PAYMENT: 'Subscription',
      APP_PRODUCT_PURCHASE: 'Purchase',
      DEPOSIT: 'Deposit',
      NIKAT_APP_ORDER_PAYMENT: 'Order',
      CUSTOM_WEBSITE_PURCHASE: 'Website'
    };
    return labels[reason] ?? reason;
  }

  static resolveStatusDisplay(status?: string): SubscriptionStatusDisplay {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          variant: 'default',
          colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200'
        };
      case 'authenticated':
        return {
          label: 'Activating',
          variant: 'secondary',
          colorClass: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'secondary',
          colorClass: 'text-amber-600 bg-amber-50 border-amber-200'
        };
      case 'paused':
        return {
          label: 'Paused',
          variant: 'outline',
          colorClass: 'text-slate-600 bg-slate-50 border-slate-200'
        };
      case 'halted':
        return {
          label: 'Payment failed',
          variant: 'destructive',
          colorClass: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'destructive',
          colorClass: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'completed':
        return {
          label: 'Expired',
          variant: 'outline',
          colorClass: 'text-slate-500 bg-slate-50 border-slate-200'
        };
      default:
        return {
          label: 'No plan',
          variant: 'outline',
          colorClass: 'text-slate-400 bg-slate-50 border-slate-200'
        };
    }
  }
}
