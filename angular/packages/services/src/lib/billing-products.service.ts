import { Injectable, inject } from '@angular/core';
import { FirebaseFunctionsService } from './firebase-functions.service';
import { GlobalManagerService } from './global-manager-service';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import {
  Amount,
  APPID,
  CreateProductCheckoutResponse,
  GetProductsForAppRequest,
  GetProductsForAppResponse,
  PaymentType,
  PurchasableProduct,
  TransactionProcessorID,
  UserSubscription
} from '@workern/models';
import { Observable, of, switchMap } from 'rxjs';
import { orderBy, where, limit } from '@angular/fire/firestore';

export interface BillingTransaction {
  id: string;
  state: string;
  reason: string;
  amount: Amount;
  createdAt: Date;
  finalizedAt: Date | null;
  notes: Record<string, any>;
  processor: { id: string; data?: any };
}

export interface BillingDialogPlanView {
  id: string;
  name: string;
  amount: Amount;
  intervalLabel?: string;
  description?: string;
  badge?: string;
  highlighted?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly firebaseFunctionsService = inject(FirebaseFunctionsService);
  private readonly globalManagerService = inject(GlobalManagerService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);

  private getAppId(explicitAppId?: string): string {
    const appId = explicitAppId || this.globalManagerService.spaceId();

    if (!appId) {
      throw new Error(
        'Missing appId. Configure GlobalManagerService spaceId or pass appId explicitly.'
      );
    }

    return appId;
  }

  async getProductsForApp(
    request: Omit<GetProductsForAppRequest, 'appId'> & { appId?: APPID }
  ): Promise<GetProductsForAppResponse> {
    const finalRequest: GetProductsForAppRequest = {
      ...request,
      appId: this.getAppId(request.appId)
    };

    return this.firebaseFunctionsService.firebaseCall<
      GetProductsForAppRequest,
      GetProductsForAppResponse
    >('billing-getProducts', finalRequest);
  }

  async createCheckoutSession(request: {
    appId?: string;
    productId: string;
    entitlementId: string;
    gateway: TransactionProcessorID;
    quantity?: number;
    langCode?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreateProductCheckoutResponse> {
    const finalRequest: Record<string, unknown> = {
      ...request,
      appId: this.getAppId(request.appId)
    };

    return this.firebaseFunctionsService.firebaseCall<
      Record<string, unknown>,
      CreateProductCheckoutResponse
    >('billing-createProductCheckoutSession', finalRequest);
  }

  mapProductsToDialogPlans(options: {
    products: PurchasableProduct[];
    preferredGateways: readonly TransactionProcessorID[];
    paymentType?: PaymentType;
  }): BillingDialogPlanView[] {
    const { products, preferredGateways, paymentType } = options;

    const plans: BillingDialogPlanView[] = [];

    for (const product of products) {
      if (paymentType && product.paymentType !== paymentType) {
        continue;
      }

      const gateway = preferredGateways.find(
        (candidate) => product.gateways?.[candidate]?.enabled
      );

      if (!gateway) {
        continue;
      }

      const gatewayConfig = product.gateways[gateway];
      if (!gatewayConfig) {
        continue;
      }

      const price = gatewayConfig.price;
      const intervalLabel =
        product.paymentType === PaymentType.SUBSCRIPTION
          ? this.getIntervalLabel(price.intervalCount, price.intervalUnit)
          : undefined;

      plans.push({
        id: `${product.id}:${gateway}`,
        name: product.name,
        amount: price.amount,
        intervalLabel,
        description: product.description,
        badge: price.displayLabel,
        metadata: {
          appId: product.app.id,
          productId: product.id,
          entitlementId: product.entitlementId,
          gateway,
          paymentType: product.paymentType
        }
      });
    }

    return plans;
  }

  private getIntervalLabel(
    intervalCount?: number,
    intervalUnit?: string
  ): string | undefined {
    if (!intervalCount || !intervalUnit) {
      return undefined;
    }

    const unit = intervalUnit.toLowerCase();
    if (intervalCount === 1) {
      return `per ${unit}`;
    }

    return `every ${intervalCount} ${unit}s`;
  }

  /**
   * Streams the active UserSubscription doc for the given app.
   * Path: users/{uid}/mySpaces/{appId}/subscriptions  (first active or most recent)
   */
  getActiveSubscription(appId?: string): Observable<UserSubscription | null> {
    return new Observable((observer) => {
      const uid = this.authService.uid();
      if (!uid) {
        observer.next(null);
        observer.complete();
        return;
      }
      const resolvedAppId = this.getAppId(appId);
      this.firestoreService
        .getCollection<UserSubscription>(
          `users/${uid}/mySpaces/${resolvedAppId}/subscriptions`,
          where('status', 'in', [
            'active',
            'authenticated',
            'created',
            'pending',
            'halted',
            'paused',
            'cancelled',
            'completed'
          ]),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        .subscribe({
          next: (docs) => observer.next(docs[0] ?? null),
          error: (e) => observer.error(e)
        });
    });
  }

  /**
   * Streams billing transactions for the given app (subscription + one-time).
   * Path: users/{uid}/transactions  filtered by notes.appId
   */
  getBillingTransactions(
    appId?: string,
    maxItems = 20
  ): Observable<BillingTransaction[]> {
    return new Observable((observer) => {
      const uid = this.authService.uid();
      if (!uid) {
        observer.next([]);
        observer.complete();
        return;
      }
      const resolvedAppId = this.getAppId(appId);
      this.firestoreService
        .getCollection<BillingTransaction>(
          `users/${uid}/transactions`,
          where('notes.appId', '==', resolvedAppId),
          where('state', '==', 'SUCCESSFUL'),
          orderBy('createdAt', 'desc'),
          limit(maxItems)
        )
        .subscribe({
          next: (docs) => observer.next(docs),
          error: (e) => observer.error(e)
        });
    });
  }

  /**
   * Cancel an active subscription.
   * @param cancelAtCycleEnd true (default) = cancel at end of billing period;
   *                         false = cancel immediately
   */
  async cancelSubscription(request: {
    appId?: string;
    productId: string;
    cancelAtCycleEnd?: boolean;
  }): Promise<{ success: boolean }> {
    return this.firebaseFunctionsService.firebaseCall(
      'billing-cancelSubscription',
      {
        ...request,
        appId: this.getAppId(request.appId)
      }
    );
  }
}
