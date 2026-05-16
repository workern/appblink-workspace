import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { checkRequest, getUser } from '../utils';
import {
  db,
  deployOptions,
  isProduction,
  razorpayKeyId,
  razorpayKeySecret
} from '../global';
import {
  CreateProductCheckoutResponse,
  GetProductsForAppResponse,
  PaymentType,
  ProductStatus,
  PurchasableProduct,
  TransactionProcessorID,
  Amount,
  UserSubscription,
  getBillingIntervalUnitInMs,
  BillingIntervalUnit
} from '@workern/models';
import {
  createRazorpayOrderAndFirestoreEntry,
  createRazorpaySubscriptionAndFirestoreEntry
} from './gateways/razorpay';
import { revokeAppProductEntitlement } from './gateways/common';
const Razorpay = require('razorpay');
import { createLemonSqueezyCheckoutAndFirestoreEntry } from './gateways/lemonsqueezy';
import { createDodoSubscriptionSession } from './gateways/dodo-payments';
import { TransactionReason } from '../enums/transactions/transaction-reason';
import { TransactionType } from '../enums/transactions/transaction-type';

import { FieldValue } from 'firebase-admin/firestore';

const gatewaySchema = z.enum(TransactionProcessorID);
const paymentTypeSchema = z.enum(PaymentType);

const getProductsForAppSchema = z.object({
  appId: z.string().min(1),
  paymentType: paymentTypeSchema.optional(),
  gateway: gatewaySchema.optional(),
  includeInactive: z.boolean().optional(),
  secret: z.literal('shambho').optional()
});

const createProductCheckoutSchema = z.object({
  appId: z.string().min(1),
  productId: z.string().min(1),
  entitlementId: z.string().min(1),
  gateway: gatewaySchema,
  quantity: z.number().int().positive().optional(),
  langCode: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const amountSchema = z.object({
  value: z.number(),
  currency: z.string(),
  symbol: z.string()
});

const gatewayPriceSchema = z.object({
  amount: amountSchema,
  intervalCount: z.number().int().positive().optional(),
  intervalUnit: z.string().optional(),
  trialDays: z.number().int().nonnegative().optional(),
  displayLabel: z.string().optional()
});

const gatewayConfigSchema = z.object({
  gateway: gatewaySchema.optional(),
  enabled: z.boolean(),
  externalProductId: z.string().optional(),
  externalPriceId: z.string().optional(),
  checkoutUrl: z.string().optional(),
  price: gatewayPriceSchema,
  metadata: z.record(z.string(), z.unknown()).optional()
});

const productPayloadSchema = z.object({
  app: z.object({
    id: z.string().min(1),
    name: z.string().optional()
  }),
  name: z.string().min(1),
  description: z.string().optional(),
  paymentType: paymentTypeSchema,
  status: z.nativeEnum(ProductStatus),
  features: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  gateways: z.record(z.string(), gatewayConfigSchema),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const createProductSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  productId: z.string().min(1).optional(),
  product: productPayloadSchema,
  secret: z.literal('shambho').optional()
});

const updateProductSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  productId: z.string().min(1),
  product: productPayloadSchema.partial(),
  secret: z.literal('shambho').optional()
});

const deleteProductSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  productId: z.string().min(1),
  secret: z.literal('shambho').optional()
});

const FALLBACK_LOGO_URL = 'https://workern-assets.b-cdn.net/workern_logo.png';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function hasGlobalAdminClaim(request: any): boolean {
  return request?.auth?.token?.globalAdmin === true;
}

function hasProductWriteClaim(request: any, appId: string): boolean {
  const tokenClaims = asRecord(request?.auth?.token);
  const adminClaims = asRecord(tokenClaims?.['admin']);
  const appClaims = asRecord(adminClaims?.[appId]);
  const productsClaims = asRecord(appClaims?.['products']);
  return productsClaims?.['write'] === true;
}

function assertCanManageProducts(request: any, appId: string) {
  if (hasGlobalAdminClaim(request)) {
    return;
  }

  if (hasProductWriteClaim(request, appId)) {
    return;
  }

  throw new HttpsError(
    'permission-denied',
    `Missing product write access for app ${appId}`
  );
}

function normalizeProduct(
  productId: string,
  entitlementId: string,
  data: FirebaseFirestore.DocumentData
): PurchasableProduct {
  return {
    id: productId,
    entitlementId,
    ...data
  } as PurchasableProduct;
}

/** Returns the Firestore ref for a product at: entitlements/{entitlementId}/products/{productId} */
function getProductRef(entitlementId: string, productId: string) {
  return db
    .collection('entitlements')
    .doc(entitlementId)
    .collection('products')
    .doc(productId);
}

function isProductVisibleForFilter(
  product: PurchasableProduct,
  options: {
    includeInactive: boolean;
    paymentType?: PaymentType;
    gateway?: TransactionProcessorID;
  }
): boolean {
  if (!options.includeInactive && product.status !== ProductStatus.ACTIVE) {
    return false;
  }

  if (options.paymentType && product.paymentType !== options.paymentType) {
    return false;
  }

  if (options.gateway) {
    const gatewayConfig = product.gateways?.[options.gateway];
    return !!gatewayConfig?.enabled;
  }

  return true;
}

function buildAmountWithQuantity(amount: Amount, quantity: number): Amount {
  return {
    ...amount,
    value: Math.round(amount.value * quantity)
  };
}

export const getProducts = onCall(
  {
    ...deployOptions,
    region: 'asia-south2'
  },
  async (request): Promise<GetProductsForAppResponse> => {
    await checkRequest(request, getProductsForAppSchema, false);

    const { appId, paymentType, gateway, includeInactive } =
      getProductsForAppSchema.parse(request.data);

    // Collection group query across entitlements/{id}/products/{id}
    const snapshot = await db
      .collectionGroup('products')
      .where('app.id', '==', appId)
      .get();

    const products = snapshot.docs
      .map((doc) => {
        // doc.ref.parent.parent.id = entitlementId since path is:
        //   entitlements/{entitlementId}/products/{productId}
        const entitlementId = doc.ref.parent.parent?.id ?? '';
        return normalizeProduct(doc.id, entitlementId, doc.data());
      })
      .filter((product) =>
        isProductVisibleForFilter(product, {
          includeInactive: includeInactive ?? false,
          paymentType,
          gateway
        })
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return {
      appId,
      products
    };
  }
);

export const createProductCheckoutSession = onCall(
  {
    ...deployOptions,
    region: 'asia-south2',
    secrets: [razorpayKeyId, razorpayKeySecret]
  },
  async (request): Promise<CreateProductCheckoutResponse> => {
    await checkRequest(request, createProductCheckoutSchema, true);

    const uid = request.auth?.uid as string;
    const { appId, productId, entitlementId, gateway, quantity, metadata } =
      createProductCheckoutSchema.parse(request.data);

    const productRef = getProductRef(entitlementId, productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }

    const product = normalizeProduct(
      productSnap.id,
      entitlementId,
      productSnap.data()
    );

    if (product.app?.id !== appId) {
      throw new HttpsError(
        'invalid-argument',
        'Product does not belong to requested app'
      );
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new HttpsError('failed-precondition', 'Product is not active');
    }

    const gatewayConfig = product.gateways?.[gateway];
    if (!gatewayConfig?.enabled) {
      throw new HttpsError(
        'failed-precondition',
        `Gateway ${gateway} is not enabled for this product`
      );
    }

    const qty = quantity ?? 1;

    if (
      gateway === TransactionProcessorID.PLAY_STORE ||
      gateway === TransactionProcessorID.APP_STORE
    ) {
      return {
        mode: 'IN_APP_PURCHASE',
        gateway: {
          name: gateway,
          data: {
            appId,
            productId,
            storeProductId: gatewayConfig.externalProductId,
            metadata
          }
        },
        product
      };
    }

    const amount = buildAmountWithQuantity(gatewayConfig.price.amount, qty);
    let result;

    if (gateway === TransactionProcessorID.RAZORPAY) {
      const notes = {
        appId,
        productId: product.id,
        entitlementId,
        paymentType: product.paymentType,
        gateway,
        quantity: qty,
        entitlementPeriodInMs:
          getBillingIntervalUnitInMs(
            gatewayConfig.price.intervalUnit as BillingIntervalUnit
          ) * (gatewayConfig.price.intervalCount ?? 1),
        source: appId
      };
      if (product.paymentType === PaymentType.SUBSCRIPTION) {
        result = await createRazorpaySubscriptionAndFirestoreEntry({
          planId:
            gatewayConfig.externalPriceId ||
            gatewayConfig.externalProductId ||
            '',
          amount,
          totalCount: 120,
          notes: notes,
          uid,
          type: TransactionType.CREDIT,
          reason: TransactionReason.APP_PRODUCT_PURCHASE,
          description: (product.description || product.name).substring(0, 255), // Razorpay has a 255 char limit on this field
          logoUrl: (product.metadata?.logoUrl as string) || FALLBACK_LOGO_URL,
          appName: product.app?.name || appId
        });
      } else if (product.paymentType === PaymentType.ONE_TIME) {
        result = await createRazorpayOrderAndFirestoreEntry({
          amount,
          notes: notes,
          uid,
          type: TransactionType.CREDIT,
          reason: TransactionReason.APP_PRODUCT_PURCHASE,
          description: product.description || product.name,
          logoUrl: (product.metadata?.logoUrl as string) || FALLBACK_LOGO_URL,
          appName: product.app?.name || appId,
          removeCallbackUrl: false
        });
      }

      return {
        mode: 'EXTERNAL_CHECKOUT',
        gateway: result.gateway,
        product,
        transactionId: result.transaction.id
      };
    } else if (gateway === TransactionProcessorID.LEMON_SQUEEZY) {
      const user = (await getUser(uid)) as any;
      if (!user?.email) {
        throw new HttpsError(
          'failed-precondition',
          'Email is required for Lemon Squeezy checkout'
        );
      }

      const variantId =
        gatewayConfig.externalPriceId || gatewayConfig.externalProductId;
      if (!variantId) {
        throw new HttpsError(
          'failed-precondition',
          'Missing Lemon Squeezy product variant configuration'
        );
      }

      const result = await createLemonSqueezyCheckoutAndFirestoreEntry({
        amount,
        notes: {
          appId,
          productId: product.id,
          entitlementId,
          paymentType: product.paymentType,
          gateway,
          quantity: qty,
          metadata: metadata || null,
          source: appId
        },
        uid,
        type: TransactionType.CREDIT,
        reason: TransactionReason.APP_PRODUCT_PURCHASE,
        description: product.description || product.name,
        customerEmail: user.email,
        customerName: user.name || 'User',
        productVariantId: variantId
      });

      return {
        mode: 'EXTERNAL_CHECKOUT',
        gateway: result.gateway,
        product,
        transactionId: result.transaction.id
      };
    } else if (gateway === TransactionProcessorID.DODO_PAYMENTS) {
      const externalProductId = gatewayConfig.externalProductId;
      if (!externalProductId) {
        throw new HttpsError(
          'failed-precondition',
          'Missing Dodo product mapping'
        );
      }

      const subscription = await createDodoSubscriptionSession({
        uid,
        productId: externalProductId
      });

      return {
        mode: 'EXTERNAL_CHECKOUT',
        gateway: {
          name: TransactionProcessorID.DODO_PAYMENTS,
          data: subscription
        },
        product
      };
    }

    throw new HttpsError(
      'invalid-argument',
      `Gateway ${gateway} is not supported yet`
    );
  }
);

export const createProduct = onCall(
  {
    ...deployOptions,
    region: 'asia-south2'
  },
  async (request) => {
    await checkRequest(request, createProductSchema, false);

    const uid = request.auth?.uid as string;
    const { appId, entitlementId, productId, product } =
      createProductSchema.parse(request.data);

    if (product.app.id !== appId) {
      throw new HttpsError(
        'invalid-argument',
        'Product app.id must match appId in request'
      );
    }

    const user = isProduction && uid ? await getUser(uid) : undefined;
    const entitlementRef = db.collection('entitlements').doc(entitlementId);
    const finalProductId =
      productId || entitlementRef.collection('products').doc().id;
    const productRef = entitlementRef
      .collection('products')
      .doc(finalProductId);

    await productRef.set({
      ...product,
      id: finalProductId,
      entitlementId,
      owner: {
        uid,
        name: user?.name || 'Unknown'
      },
      space: {
        id: appId
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      productId: finalProductId
    };
  }
);

export const updateProduct = onCall(
  {
    ...deployOptions,
    region: 'asia-south2'
  },
  async (request) => {
    await checkRequest(request, updateProductSchema, false);

    const { appId, entitlementId, productId, product } =
      updateProductSchema.parse(request.data);

    const productRef = getProductRef(entitlementId, productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }

    const existing = normalizeProduct(
      productSnap.id,
      entitlementId,
      productSnap.data()
    );
    if (existing.app?.id !== appId) {
      throw new HttpsError(
        'permission-denied',
        'Product does not belong to requested app'
      );
    }

    if (product.app?.id && product.app.id !== appId) {
      throw new HttpsError(
        'invalid-argument',
        'Product app.id must match appId in request'
      );
    }

    await productRef.set(
      {
        ...product,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      success: true,
      productId
    };
  }
);

export const deleteProduct = onCall(
  {
    ...deployOptions,
    region: 'asia-south2'
  },
  async (request) => {
    await checkRequest(request, deleteProductSchema, false);

    const { appId, entitlementId, productId } = deleteProductSchema.parse(
      request.data
    );

    const productRef = getProductRef(entitlementId, productId);
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }

    const existing = normalizeProduct(
      productSnap.id,
      entitlementId,
      productSnap.data()
    );
    if (existing.app?.id !== appId) {
      throw new HttpsError(
        'permission-denied',
        'Product does not belong to requested app'
      );
    }

    await productRef.delete();

    return {
      success: true,
      productId
    };
  }
);

// ─── Cancel Subscription ───────────────────────────────────────────────────────

const cancelSubscriptionSchema = z.object({
  appId: z.string().min(1),
  /** The Firestore doc ID (same as productId) */
  productId: z.string().min(1),
  /**
   * true  = cancel at end of the current billing period (default, recommended)
   * false = cancel immediately — access revoked right away
   */
  cancelAtCycleEnd: z.boolean().optional().default(true)
});

export const cancelSubscription = onCall(
  {
    ...deployOptions,
    region: 'asia-south2',
    secrets: [razorpayKeyId, razorpayKeySecret]
  },
  async (request) => {
    await checkRequest(request, cancelSubscriptionSchema, true);

    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');

    const { appId, productId, cancelAtCycleEnd } =
      cancelSubscriptionSchema.parse(request.data);

    const subRef = db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc(appId)
      .collection('subscriptions')
      .doc(productId);

    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      throw new HttpsError('not-found', 'Subscription not found');
    }

    const sub = subSnap.data() as UserSubscription;
    if (!sub.subscriptionId) {
      throw new HttpsError(
        'failed-precondition',
        'No Razorpay subscription ID on this document'
      );
    }

    const instance = new Razorpay({
      key_id: isProduction ? razorpayKeyId.value() : 'rzp_test_Rm3ZpwsyNst8nl',
      key_secret: isProduction
        ? razorpayKeySecret.value()
        : 'bKqN5kUJ8wmXx5d0RBkS4NXI'
    });

    await instance.subscriptions.cancel(
      sub.subscriptionId,
      cancelAtCycleEnd ? 1 : 0
    );

    if (cancelAtCycleEnd) {
      // Soft cancel: subscription stays active until currentPeriodEnd.
      // Mark the flag so the UI shows "Cancels at end of billing period".
      // The webhook subscription.cancelled fires at period end and will
      // delete the doc + revoke claims at that point.
      await subRef.update({
        cancelAtCycleEnd: true,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      // Immediate cancel: revoke claims and delete the doc right away without
      // waiting for the webhook so the UI reflects the change instantly.
      await revokeAppProductEntitlement({
        uid,
        notes: { appId, productId },
        reason: 'cancelled'
      });
      await subRef.delete();
    }

    return { success: true };
  }
);
