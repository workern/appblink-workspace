import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  resource,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BillingDialogPlanView,
  BillingService,
  RazorpayService,
  SnackbarService
} from '@workern/services';
import {
  GatewayOrderCreationResult,
  TransactionProcessorID
} from '@workern/models';
import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmCardImports } from '@spartan/components/card';
import { AmountDisplayPipe } from '@workern/pipes';
export type PaymentDialogPurchaseType = 'subscription' | 'one-time';

export interface PaymentDialogFeature {
  readonly label: string;
  readonly description?: string;
  readonly included?: boolean;
}

export interface PaymentDialogCheckoutContext {
  readonly plan: BillingDialogPlanView;
  readonly gateway: GatewayOrderCreationResult;
  readonly response: unknown;
}

interface BillingPlanContext {
  readonly productId: string;
  readonly entitlementId: string;
  readonly gateway: TransactionProcessorID;
}

interface LemonSqueezyWindow {
  Setup(options: { eventHandler?: (event: unknown) => void }): void;
  Url: {
    Open(url: string): void;
  };
}

@Component({
  selector: 'wn-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    AmountDisplayPipe
  ],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDialog {
  private readonly billingProductsService = inject(BillingService);
  private readonly razorpayService = inject(RazorpayService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly preferredGateways: readonly TransactionProcessorID[] = [
    TransactionProcessorID.RAZORPAY,
    TransactionProcessorID.LEMON_SQUEEZY,
    TransactionProcessorID.DODO_PAYMENTS,
    TransactionProcessorID.PLAY_STORE,
    TransactionProcessorID.APP_STORE
  ];

  readonly open = input(false);
  protected readonly loadingButtonText = 'Processing...';

  readonly canceled = output<void>();
  readonly checkoutStarted = output<PaymentDialogCheckoutContext>();
  readonly checkoutCompleted = output<PaymentDialogCheckoutContext>();
  readonly checkoutFailed = output<string>();

  protected readonly selectedPlanId = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  private readonly plansResource = resource({
    params: () => ({ open: this.open() }),
    loader: async () => {
      const response = await this.billingProductsService.getProductsForApp({
        includeInactive: false
      });
      const plans = this.billingProductsService.mapProductsToDialogPlans({
        products: response.products,
        preferredGateways: this.preferredGateways
      });
      return plans;
    }
  });

  protected readonly isLoadingPlans = this.plansResource.isLoading;
  protected readonly plans = computed(() => this.plansResource.value() ?? []);
  private readonly loadedPlanContextById = computed(() => {
    const plans = this.plans();
    const planContextById: Record<string, BillingPlanContext> = {};
    for (const plan of plans) {
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
        continue;
      }

      planContextById[plan.id] = { productId, entitlementId, gateway };
    }

    return planContextById;
  });

  private readonly effectivePurchaseType = computed<
    PaymentDialogPurchaseType | 'mixed'
  >(() => {
    const plans = this.plans();
    if (!plans.length) {
      return 'subscription';
    }

    let hasOneTime = false;
    let hasSubscription = false;

    for (const plan of plans) {
      const metadata = plan.metadata as Record<string, unknown> | undefined;
      const paymentTypeValue = metadata?.['paymentType'];

      if (paymentTypeValue === 'ONE_TIME') {
        hasOneTime = true;
      }

      if (paymentTypeValue === 'SUBSCRIPTION') {
        hasSubscription = true;
      }
    }

    if (hasOneTime && hasSubscription) {
      return 'mixed';
    }

    if (hasOneTime) {
      return 'one-time';
    }

    return 'subscription';
  });

  protected readonly features = computed<readonly PaymentDialogFeature[]>(
    () => []
  );

  protected readonly resolvedTitle = computed(() => {
    return this.effectivePurchaseType() === 'one-time'
      ? 'Complete your purchase'
      : 'Choose your subscription';
  });

  protected readonly resolvedDescription = computed(() => {
    return this.effectivePurchaseType() === 'one-time'
      ? 'Select what you want to buy and continue to checkout.'
      : 'Pick a plan that fits your needs.';
  });

  protected readonly resolvedSubmitButtonText = computed(() => {
    return this.effectivePurchaseType() === 'one-time' ? 'Buy now' : 'Continue';
  });

  protected readonly emptyStateMessage = computed(() =>
    this.effectivePurchaseType() === 'one-time'
      ? 'No purchasable items are available right now.'
      : 'No subscription plans are available right now.'
  );

  protected readonly dialogAriaLabel = computed(() =>
    this.effectivePurchaseType() === 'one-time'
      ? 'One-time purchase options'
      : 'Subscription options'
  );

  protected readonly selectedPlan = computed(() => {
    const plans = this.plans();
    const selectedPlanId = this.selectedPlanId();

    if (!plans.length) {
      return null;
    }

    if (!selectedPlanId) {
      return plans[0] ?? null;
    }

    return plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;
  });

  protected readonly checkoutMetadata = computed(() => {
    const selectedPlan = this.selectedPlan();
    if (!selectedPlan) {
      return undefined;
    }

    return {
      planId: selectedPlan.id,
      amount: selectedPlan.amount,
      metadata: selectedPlan.metadata ?? undefined
    };
  });

  constructor() {
    effect(() => {
      const plans = this.plans();
      if (plans && !this.selectedPlanId() && plans.length > 0) {
        this.selectedPlanId.set(plans[0]?.id ?? null);
      }
    });

    effect(() => {
      const error = this.plansResource.error();
      if (error) {
        this.handleFailure(
          error instanceof Error
            ? error.message
            : 'Unable to load purchasable products.'
        );
      }
    });
  }

  protected closeDialog() {
    this.canceled.emit();
  }

  protected selectPlan(planId: string) {
    if (this.isLoading()) {
      return;
    }

    this.selectedPlanId.set(planId);
  }

  protected async continueCheckout() {
    if (this.isLoading()) {
      return;
    }

    const selectedPlan = this.selectedPlan();
    if (!selectedPlan) {
      this.handleFailure('Please select a plan before continuing.');
      return;
    }

    this.isLoading.set(true);

    try {
      const checkoutResult = await this.createCheckoutForPlan(selectedPlan);

      if (!checkoutResult) {
        this.handleFailure('Unable to initialize payment gateway.');
        return;
      }

      const context: PaymentDialogCheckoutContext = checkoutResult;
      const gateway = context.gateway;
      const response = context.response;

      this.checkoutStarted.emit(context);

      if (gateway.name === TransactionProcessorID.RAZORPAY) {
        this.razorpayService.payWithRazorpay(gateway);
        this.checkoutCompleted.emit(context);
        return;
      }

      if (gateway.name === TransactionProcessorID.LEMON_SQUEEZY) {
        const checkoutUrl = this.resolveLemonSqueezyUrl(response, gateway);

        if (!checkoutUrl) {
          this.handleFailure('Checkout URL is missing for LemonSqueezy.');
          return;
        }

        this.openLemonSqueezy(checkoutUrl, context);
        return;
      }

      const checkoutUrl = this.resolveExternalCheckoutUrl(response, gateway);
      if (checkoutUrl) {
        this.openExternalCheckout(checkoutUrl, context);
        return;
      }

      this.handleFailure(`Unsupported payment processor: ${gateway.name}`);
    } catch (error: unknown) {
      this.handleFailure(
        error instanceof Error
          ? error.message
          : 'Unable to start payment. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async createCheckoutForPlan(
    selectedPlan: BillingDialogPlanView
  ): Promise<PaymentDialogCheckoutContext | null> {
    const planContext = this.loadedPlanContextById()[selectedPlan.id];
    if (!planContext) {
      return null;
    }

    const response = await this.billingProductsService.createCheckoutSession({
      productId: planContext.productId,
      entitlementId: planContext.entitlementId,
      gateway: planContext.gateway,
      quantity: 1,
      metadata: this.checkoutMetadata()
    });

    return {
      plan: selectedPlan,
      gateway: response.gateway,
      response
    };
  }

  private resolveExternalCheckoutUrl(
    response: unknown,
    gateway: GatewayOrderCreationResult
  ): string | null {
    const gatewayUrl =
      this.readNestedString(gateway, ['data', 'checkoutUrl']) ||
      this.readNestedString(gateway, ['data', 'checkout_url']) ||
      this.readNestedString(gateway, ['data', 'paymentLink']) ||
      this.readNestedString(gateway, ['data', 'payment_link']) ||
      this.readNestedString(gateway, ['data', 'url']);

    if (gatewayUrl) {
      return gatewayUrl;
    }

    return (
      this.readNestedString(response, ['gateway', 'data', 'checkoutUrl']) ||
      this.readNestedString(response, ['gateway', 'data', 'checkout_url']) ||
      this.readNestedString(response, ['gateway', 'data', 'paymentLink']) ||
      this.readNestedString(response, ['gateway', 'data', 'payment_link']) ||
      this.readNestedString(response, ['gateway', 'data', 'url']) ||
      this.readNestedString(response, ['data', 'checkoutUrl']) ||
      this.readNestedString(response, ['data', 'checkout_url']) ||
      this.readNestedString(response, ['data', 'paymentLink']) ||
      this.readNestedString(response, ['data', 'payment_link']) ||
      this.readNestedString(response, ['data', 'url']) ||
      null
    );
  }

  private openExternalCheckout(
    checkoutUrl: string,
    context: PaymentDialogCheckoutContext
  ) {
    if (typeof window === 'undefined') {
      this.handleFailure('Browser environment is required for checkout.');
      return;
    }

    window.location.href = checkoutUrl;
    this.checkoutCompleted.emit(context);
  }

  private resolveLemonSqueezyUrl(
    response: unknown,
    gateway: GatewayOrderCreationResult
  ): string | null {
    if (gateway.name === TransactionProcessorID.LEMON_SQUEEZY) {
      const fromGateway = this.readNestedString(gateway, [
        'data',
        'attributes',
        'url'
      ]);

      if (fromGateway) {
        return fromGateway;
      }
    }

    return this.readNestedString(response, [
      'billing',
      'gateway',
      'data',
      'attributes',
      'url'
    ]);
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readNestedString(
    value: unknown,
    path: readonly string[]
  ): string | null {
    let current: unknown = value;

    for (const segment of path) {
      const record = this.asRecord(current);
      if (!record) {
        return null;
      }

      current = record[segment];
    }

    return typeof current === 'string' ? current : null;
  }

  private openLemonSqueezy(
    checkoutUrl: string,
    context: PaymentDialogCheckoutContext
  ) {
    if (typeof window === 'undefined') {
      this.handleFailure('Browser environment is required for checkout.');
      return;
    }

    const lemonSqueezy = (
      window as Window & { LemonSqueezy?: LemonSqueezyWindow }
    ).LemonSqueezy;

    if (!lemonSqueezy) {
      window.location.href = checkoutUrl;
      this.checkoutCompleted.emit(context);
      return;
    }

    lemonSqueezy.Setup({
      eventHandler: (event) => {
        const eventName = this.asRecord(event)?.['event'];
        if (eventName === 'Checkout.Success') {
          this.checkoutCompleted.emit(context);
        }
      }
    });

    lemonSqueezy.Url.Open(checkoutUrl);
  }

  private handleFailure(message: string) {
    this.snackbarService.error(message);
    this.checkoutFailed.emit(message);
  }
}
