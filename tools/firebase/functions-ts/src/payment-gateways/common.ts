import { HttpsError } from 'firebase-functions/https';
import {
  admin,
  db,
  defaultSuccessResult,
  firestoreWriteTimestamp,
  transactionsByIdCollection
} from '../global';
import { Transaction } from '../models/transactions/transaction';
import { TRANSACTION_STATE_PENDING } from '../constants';
import { log } from 'firebase-functions/logger';
import { messages } from '../constants/messages';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { TransactionState } from '../enums/transactions/transaction-state';
import { TransactionReason } from '../enums/transactions/transaction-reason';
import { activateTask } from '../tasks/tasks-app';
import { getPlanLimit } from '../automations/leads/plans-utils';

import { getExpectedDeliveryForOrder } from '../apps/sangrah-nikat-common/utils';
import {
  APPID,
  Amount,
  CustomWebsite,
  Item,
  Order,
  OrderStatuses,
  PurchasableProduct,
  UserSubscription
} from '@workern/models';
import {
  DeliveryStatus,
  OrderFulfillment,
  SangrahShop,
  ItemVariant
} from '@workern/models';

import {} from '@workern/models';
import { createOrderNotification } from '../apps/nikat-app/orders';

import {
  getGiftUrl,
  getGlobalWebsiteRef,
  getUserWebsiteRef
} from '../apps/egifts-app/custom-website';
import { GIFT_REASON_METADATA, GiftReason } from '@workern/models';
import {
  grantRevenueCatEntitlement,
  revokeRevenueCatEntitlement
} from './revenue-cat';

/**
 * Resolves the workern APPID for a given entitlement identifier by reading
 * the `entitlements/{entitlementId}` document from Firestore.
 *
 * This is the canonical way for all payment gateways to map an entitlement
 * back to the app it belongs to — no hardcoded maps needed.
 *
 * @param entitlementId - The entitlement identifier (e.g. 'saveNestPro')
 * @param fallback      - Value to return when the doc doesn't exist (default 'unknown')
 */
export async function resolveAppIdFromEntitlement(
  entitlementId: string,
  fallback = 'unknown'
): Promise<string> {
  const snap = await db.collection('entitlements').doc(entitlementId).get();
  if (!snap.exists) {
    log(
      `resolveAppIdFromEntitlement: no doc for entitlementId=${entitlementId}, using fallback=${fallback}`
    );
    return fallback;
  }
  return (snap.data()?.appId as string) ?? fallback;
}

export async function activateAppProductEntitlement(details: {
  uid: string;
  notes: Record<string, any>;
}) {
  const { uid, notes } = details;
  // entitlementId is the primary key — productId is kept for subscription doc lookups
  const entitlementId = notes?.entitlementId as string | undefined;
  // appId may be pre-supplied by the caller; if absent, resolve from Firestore
  let appId = (notes?.appId as string | undefined) || undefined;

  if (!uid || !entitlementId) {
    log(`activateAppProductEntitlement: missing uid/entitlementId — skipping`, {
      uid,
      entitlementId
    });
    return;
  }

  if (!appId) {
    appId = await resolveAppIdFromEntitlement(entitlementId);
  }

  const userRecord = await admin.auth().getUser(uid);
  const currentClaims = (userRecord.customClaims || {}) as Record<string, any>;
  const currentAppClaims =
    currentClaims[appId] && typeof currentClaims[appId] === 'object'
      ? (currentClaims[appId] as Record<string, any>)
      : {};
  const currentEntitlements =
    currentAppClaims.entitlements &&
    typeof currentAppClaims.entitlements === 'object'
      ? (currentAppClaims.entitlements as Record<string, any>)
      : {};

  const nextAppClaims = {
    ...currentAppClaims,
    entitlements: {
      ...currentEntitlements,
      [entitlementId]: true
    }
  };

  await db
    .collection('userClaims')
    .doc(uid)
    .set(
      {
        [appId]: nextAppClaims,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  log(
    `activateAppProductEntitlement: granted [${appId}][entitlements.${entitlementId}] for uid=${uid}`
  );

  // Also grant entitlement in RevenueCat (entitlementId maps directly to RC entitlement)
  const entitlementPeriodInMs = notes?.entitlementPeriodInMs as
    | number
    | undefined;

  await grantRevenueCatEntitlement(uid, entitlementId, entitlementPeriodInMs);
}

/**
 * Revokes a subscription entitlement for the user.
 * Used when a subscription is cancelled, halted, paused, or completed.
 */
export async function revokeAppProductEntitlement(details: {
  uid: string;
  notes: Record<string, any>;
  reason: string;
}) {
  const { uid, notes, reason } = details;
  // appId may be pre-supplied by the caller; if absent, resolve from Firestore
  let appId = (notes?.appId as string | undefined) || undefined;
  const entitlementId = notes?.entitlementId as string | undefined;

  if (!uid || !entitlementId) {
    log('revokeAppProductEntitlement: missing uid/entitlementId — skipping');
    return;
  }

  if (!appId) {
    appId = await resolveAppIdFromEntitlement(entitlementId);
  }

  const userRecord = await admin.auth().getUser(uid);
  const currentClaims = (userRecord.customClaims || {}) as Record<string, any>;
  const currentAppClaims =
    currentClaims[appId] && typeof currentClaims[appId] === 'object'
      ? (currentClaims[appId] as Record<string, any>)
      : {};
  const currentEntitlements =
    currentAppClaims.entitlements &&
    typeof currentAppClaims.entitlements === 'object'
      ? { ...(currentAppClaims.entitlements as Record<string, any>) }
      : {};

  delete currentEntitlements[entitlementId];

  const nextAppClaims = {
    ...currentAppClaims,
    entitlements: currentEntitlements
  };

  await db
    .collection('userClaims')
    .doc(uid)
    .set(
      {
        [appId]: nextAppClaims,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  log(
    `revokeAppProductEntitlement: revoked [${appId}][entitlements.${entitlementId}] for uid=${uid}, reason=${reason}`
  );

  // Also revoke entitlement in RevenueCat
  await revokeRevenueCatEntitlement(uid, entitlementId);
}

/**
 * Creates or updates the `UserSubscription` doc at:
 *   users/{uid}/mySpaces/{appId}/subscriptions/{enrollmentTransactionId}
 *
 * This is the single document the frontend reads to build the entire billing
 * section: current plan, status, next renewal date, cycle counts, etc.
 *
 * Razorpay epoch-second timestamps are converted to Firestore Timestamps.
 */
export async function upsertUserSubscriptionDoc(details: {
  enrollmentTransactionId: string;
  uid: string;
  appId: string;
  productId: string;
  entitlementId: string;
  amount: Amount;
  subscriptionEntity: {
    id: string;
    plan_id: string;
    status: string;
    current_start?: number | null;
    current_end?: number | null;
    charge_at?: number | null;
    paid_count?: number;
    total_count?: number;
    remaining_count?: number;
    [key: string]: any;
  };
}): Promise<void> {
  const {
    enrollmentTransactionId,
    uid,
    appId,
    productId,
    entitlementId,
    amount,
    subscriptionEntity: sub
  } = details;

  const epochToTimestamp = (epoch: number | null | undefined) =>
    epoch ? Timestamp.fromMillis(epoch * 1000) : null;

  // Fetch a lightweight product snapshot for display purposes.
  let productSnapshot:
    | { id: string; name: string; description?: string; features?: string[] }
    | undefined;
  try {
    const productDoc = await db
      .collection('entitlements')
      .doc(entitlementId)
      .collection('products')
      .doc(productId)
      .get();
    if (productDoc.exists) {
      const p = productDoc.data() as PurchasableProduct;
      productSnapshot = {
        id: productId,
        name: p.name,
        ...(p.description && { description: p.description }),
        ...(p.features?.length && { features: p.features })
      };
    }
  } catch (e) {
    log(
      `upsertUserSubscriptionDoc: failed to fetch product snapshot for ${entitlementId}/${productId}`,
      e
    );
  }

  // Use productId as the document ID so:
  // 1. There is exactly one subscription doc per product per user (enforced at DB level).
  // 2. The frontend can fetch it directly as subscriptions/{productId} without a collection query.
  // 3. Re-subscriptions update the same document in-place rather than leaving ghost docs.
  const docData: Partial<UserSubscription<Timestamp | FieldValue>> = {
    id: productId,
    appId,
    enrollmentTransactionId,
    ...(productSnapshot && { product: productSnapshot }),
    subscriptionId: sub.id,
    planId: sub.plan_id,
    status: sub.status as UserSubscription['status'],
    amount,
    currentPeriodStart: epochToTimestamp(sub.current_start),
    currentPeriodEnd: epochToTimestamp(sub.current_end),
    nextChargeAt: epochToTimestamp(sub.charge_at),
    paidCount: sub.paid_count ?? 0,
    totalCount: sub.total_count ?? 0,
    remainingCount: sub.remaining_count ?? 0,
    updatedAt: FieldValue.serverTimestamp()
  };

  const ref = db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc(appId)
    .collection('subscriptions')
    .doc(productId); // keyed by productId — one doc per product per user

  // Preserve createdAt from an existing doc so we don't reset it on each
  // webhook update. Every other field is replaced wholesale so stale fields
  // (e.g. cancelAtCycleEnd from a previous subscription) never leak into a
  // re-subscription.
  const existingSnap = await ref.get();
  const createdAt = existingSnap.exists
    ? existingSnap.data()!.createdAt
    : FieldValue.serverTimestamp();

  await ref.set({ ...docData, createdAt });
  log(
    `upsertUserSubscriptionDoc: updated ${appId}/subscriptions/${productId} status=${sub.status}`
  );
}

export function onTransactionSuccessful(
  transaction: Transaction,
  gatewayData: any,
  langCode = 'en'
) {
  const userRef = db.collection('users').doc(transaction.uid);
  const transactionRef = transactionsByIdCollection.doc(transaction.id);
  const transactionRefInUser = userRef
    .collection('transactions')
    .doc(transaction.id);
  return db
    .runTransaction(async (t) => {
      const user = (await t.get(userRef)).data();
      const transaction = new Transaction((await t.get(transactionRef)).data());
      if (!user) {
        throw new HttpsError('not-found', 'User not found');
      }
      if (!transaction) {
        throw new HttpsError('not-found', 'Transaction not found');
      }
      if (user != null && transaction?.state == TRANSACTION_STATE_PENDING) {
        const notes = transaction.notes;
        transaction.message = messages[langCode].transaction.successMessage;
        transaction.finalizedAt = FieldValue.serverTimestamp();
        transaction.processor.data = gatewayData;

        transaction.state = TransactionState.SUCCESSFUL;
        if (transaction.reason == TransactionReason.DEPOSIT) {
          t.update(userRef, {
            balance: user.balance + transaction.amount.value
          });
        } else if (
          transaction.reason == TransactionReason.LEADS_APP_PLAN_PURCHASE
        ) {
          t.update(
            userRef
              .collection('mySpaces')
              .doc('leadsAppSpace')
              .collection('products')
              .doc(notes.productId),
            {
              plan: notes.planId,
              billingPeriod: {
                start: firestoreWriteTimestamp,
                end: Timestamp.fromMillis(
                  Math.max(Date.now(), notes.existingValidityTill) +
                    notes.validityDurationMs
                ),
                paidVia: 'razorpay',
                oneTimePurchase: true
              },
              currentPeriodUsage: {
                leadsGenerated: 0,
                reachedUsageLimit: false,
                leadsAllotted: notes.remainingLeads + getPlanLimit(notes.planId)
              }
            }
          );
        } else if (
          transaction.reason == TransactionReason.NIKAT_APP_ORDER_PAYMENT
        ) {
          console.log('Processing NIKAT_APP_ORDER_PAYMENT transaction');
          const orderId = notes.orderId;
          const shopId = notes.shopId;
          const customerSpaceRef = userRef
            .collection('mySpaces')
            .doc('nikatApp');
          const collectionRef = customerSpaceRef
            .collection('carts')
            .doc('default')
            .collection('items');
          const cartItemsSnap = await t.get(collectionRef);

          let shop: SangrahShop;
          if (shopId) {
            const shopDoc = await t.get(
              db.doc(`apps/sangrahApp/shops/${shopId}`)
            );
            shop = shopDoc.data() as SangrahShop;
          }
          const globalNikatAppOrderRef = db.doc(
            `apps/nikatApp/orders/${orderId}`
          );

          const orderSnap = await t.get(globalNikatAppOrderRef);
          const order: Order = orderSnap.data() as Order;
          const fulfillment: OrderFulfillment<Date | FieldValue> = {
            managedBy: shop.nikatSettings.delivery.managedBy,
            status: DeliveryStatus.UNASSIGNED,
            expectedDeliveryBy: getExpectedDeliveryForOrder(
              order,
              shop.nikatSettings.delivery
            ),
            updatedAt: firestoreWriteTimestamp
          };
          const nikatUpdateObj = {
            status: OrderStatuses.Processing,
            updatedAt: firestoreWriteTimestamp,
            paidAt: firestoreWriteTimestamp,
            fulfillment: fulfillment
          };
          t.update(
            customerSpaceRef.collection('orders').doc(orderId),
            nikatUpdateObj
          );
          t.update(globalNikatAppOrderRef, nikatUpdateObj);
          cartItemsSnap.docs.forEach((doc) => {
            t.delete(doc.ref);
          });
          if (shop && order) {
            const globalSangrahAppOrderRef = db.doc(
              `apps/sangrahApp/orders/${orderId}`
            );
            const newOrder = {
              ...order,
              status: OrderStatuses.Processing,
              owner: shop.owner,
              createdAt: firestoreWriteTimestamp,
              paidAt: firestoreWriteTimestamp,
              updatedAt: firestoreWriteTimestamp,
              space: shop.space,
              fulfillment: fulfillment
            };
            t.create(globalSangrahAppOrderRef, newOrder);
            t.create(
              db.doc(
                `users/${shop.owner.uid}/mySpaces/${shop.space.id}/shops/${shop.id}/orders/${orderId}`
              ),
              newOrder
            );
          }
          return Promise.resolve({
            transaction,
            shopOwnerId: shop?.owner?.uid,
            spaceId: shop?.space?.id,
            orderId,
            order
          });
        } else if (
          transaction.reason == TransactionReason.CUSTOM_WEBSITE_PURCHASE
        ) {
          const websiteId = transaction.notes.websiteId;
          const userId = transaction.uid;
          if (websiteId && userId) {
            // Update website status to paid
            const websiteRef = getUserWebsiteRef(userId, websiteId);

            const websiteDoc = await t.get(websiteRef);
            if (websiteDoc.exists) {
              const website = websiteDoc.data() as CustomWebsite;
              log('Marking custom website as paid:', websiteId, 'uid', userId);

              const updateObj = {
                'billing.status': 'paid',
                'gift.url': getGiftUrl(websiteId),
                updatedAt: firestoreWriteTimestamp
              };
              t.update(websiteRef, updateObj);
              t.update(getGlobalWebsiteRef(websiteId), updateObj);

              // Increment amountReceived and counters in config if pay-as-you-wish
              if (transaction.amount?.value) {
                const configRef = db.doc('apps/eGiftsApp/config/customWebsite');
                const giftType = website.gift.reason;

                // Build update object with proper nested structure
                const paymentUpdate: any = {
                  amountReceived: {
                    value: FieldValue.increment(transaction.amount.value),
                    symbol: '₹',
                    currency: 'INR'
                  },
                  totalWebsitesCreated: FieldValue.increment(1),
                  lastUpdated: FieldValue.serverTimestamp(),
                  giftReasonStats: {}
                };
                paymentUpdate.giftReasonStats[giftType] = {
                  totalWebsitesCreated: FieldValue.increment(1)
                };

                t.set(configRef, paymentUpdate, { merge: true });
              }

              log('gatewayData', gatewayData);
              if (gatewayData?.payment?.entity?.email) {
                const payment = gatewayData.payment.entity;
                const email = payment.email;
                const giftMetadata =
                  GIFT_REASON_METADATA[website.gift.reason as GiftReason];
                const recipientName = website?.recipient?.name;

                t.create(db.collection('mail').doc(), {
                  to: [email],
                  template: {
                    name: 'customWebsitePurchaseCompleted',
                    data: {
                      recipientName: recipientName,
                      websiteUrl: getGiftUrl(websiteId),
                      updateEmailUrl: transaction.getRedirectURL(),
                      // Gift type specific metadata
                      subject:
                        giftMetadata.email.purchaseCompleted.subject.replace(
                          '{{recipientName}}',
                          recipientName
                        ),
                      greeting: giftMetadata.email.purchaseCompleted.greeting,
                      celebrationTitle:
                        giftMetadata.email.purchaseCompleted.celebrationTitle,
                      celebrationMessage:
                        giftMetadata.email.purchaseCompleted.celebrationMessage(
                          recipientName
                        ),
                      nextStepsTitle:
                        giftMetadata.email.purchaseCompleted.nextStepsTitle,
                      nextStepsMessage:
                        giftMetadata.email.purchaseCompleted.nextStepsMessage(
                          recipientName
                        ),
                      // Gift type specific colors
                      emoji: giftMetadata.emoji,
                      primaryColor: giftMetadata.primaryColor,
                      secondaryColor: giftMetadata.secondaryColor,
                      backgroundGradient: giftMetadata.backgroundGradient
                    }
                  }
                });
              }

              return Promise.resolve({
                transaction,
                websiteId,
                userId
              });
            } else {
              log(
                'Custom website not found for marking as paid:',
                websiteId,
                'uid',
                userId
              );
            }
          } else {
            log(
              'Missing websiteId or userId for VALENTINE_WEBSITE_PURCHASE transaction'
            );
          }
        }

        t.update(transactionRef, transaction.forFirestore('admin'));
        t.update(
          transactionRefInUser,
          transaction.forFirestore('frontend_user')
        );
      }
      log('Completed transaction processing');
      return Promise.resolve(transaction);
    })
    .then(async (result: any) => {
      log(result);

      if (
        transaction.reason === TransactionReason.APP_PRODUCT_PURCHASE ||
        transaction.reason === TransactionReason.SUBSCRIPTION_PAYMENT
      ) {
        await activateAppProductEntitlement({
          uid: transaction.uid,
          notes: transaction.notes || {}
        });
      }

      // Create order notification for NIKAT_APP_ORDER_PAYMENT
      if (
        transaction.reason == TransactionReason.NIKAT_APP_ORDER_PAYMENT &&
        result.shopOwnerId &&
        result.spaceId &&
        result.orderId &&
        result.order
      ) {
        await createOrderNotification(
          result.orderId,
          result.shopOwnerId,
          result.spaceId,
          result.order.shop?.id,
          result.order
        );
      }

      if (
        transaction.reason == TransactionReason.DEPOSIT &&
        transaction.notes.task != null
      ) {
        return activateTask(transaction.notes.task, transaction.uid);
      } else {
        return defaultSuccessResult;
      }
    });
}

export function onTransactionFailed(
  transaction: Transaction,
  gatewayData: any,
  langCode = 'en'
) {
  const userRef = db.collection('users').doc(transaction.uid);
  const transactionRef = transactionsByIdCollection.doc(transaction.id);
  const transactionRefInUser = userRef
    .collection('transactions')
    .doc(transaction.id);
  return db
    .runTransaction(async (t) => {
      const user = (await t.get(userRef)).data();
      const transaction = new Transaction((await t.get(transactionRef)).data());
      if (!user) {
        throw new HttpsError('not-found', 'User not found');
      }
      if (!transaction) {
        throw new HttpsError('not-found', 'Transaction not found');
      }
      if (user != null && transaction?.state == TRANSACTION_STATE_PENDING) {
        const notes = transaction.notes;
        transaction.message = messages[langCode].transaction.successMessage;
        transaction.finalizedAt = FieldValue.serverTimestamp();
        transaction.processor.data = gatewayData;

        transaction.state = TransactionState.FAILED;
        if (transaction.reason == TransactionReason.NIKAT_APP_ORDER_PAYMENT) {
          const orderId = notes.order.id;
          const shopId = notes.shop?.id;
          const nikatCustomerSpaceRef = userRef
            .collection('mySpaces')
            .doc('nikatApp');

          let sangrahShop: SangrahShop;
          if (shopId && orderId) {
            const sangrahShopDoc = await t.get(
              db.doc(`apps/sangrahApp/shops/${shopId}`)
            );
            sangrahShop = sangrahShopDoc.data() as SangrahShop;

            const globalNikatAppOrderRef = db.doc(
              `apps/nikatApp/orders/${orderId}`
            );

            const orderSnap = await t.get(globalNikatAppOrderRef);
            const order: Order = orderSnap.data() as Order;

            // Restore inventory quantities
            if (sangrahShop && order) {
              const sangrahShopRefInUser = db
                .collection('users')
                .doc(sangrahShop.owner.uid)
                .collection('mySpaces')
                .doc(sangrahShop.space.id)
                .collection('shops')
                .doc(sangrahShop.id);

              const sangrahInventoryUpdates = new Map<
                string,
                {
                  ref: FirebaseFirestore.DocumentReference;
                  updates: Record<
                    string,
                    FirebaseFirestore.FieldValue | boolean
                  >;
                }
              >();

              for (const cartItem of order.items) {
                const productRefInUser = sangrahShopRefInUser
                  .collection('items')
                  .doc(cartItem.product.id);
                const productDoc = await t.get(productRefInUser);

                if (productDoc.exists) {
                  const item = productDoc.data() as Item;
                  const variant = item?.variants?.[cartItem.variantId];

                  if (variant) {
                    const { sellableQuantityPerUnit } = variant;
                    const requiredSellableQty =
                      cartItem.quantity * sellableQuantityPerUnit;

                    // Calculate what the total quantity will be after restoration
                    const totalQtyAcrossVariants = Object.values(
                      item.variants
                    ).reduce(
                      (sum: number, v: ItemVariant) => sum + (v.quantity || 0),
                      0
                    );

                    const newTotalQty =
                      totalQtyAcrossVariants + cartItem.quantity;

                    // Prepare update object to restore quantities
                    const existingUpdate = sangrahInventoryUpdates.get(
                      productRefInUser.id
                    );
                    const variantPath = `variants.${cartItem.variantId}`;

                    const updates = existingUpdate?.updates || {};
                    updates[`${variantPath}.quantity`] = FieldValue.increment(
                      cartItem.quantity
                    );
                    updates[`${variantPath}.sellableQuantity`] =
                      FieldValue.increment(requiredSellableQty);
                    updates[`${variantPath}.available`] = true;
                    updates['available'] = newTotalQty > 0;
                    updates['updatedAt'] = firestoreWriteTimestamp;

                    sangrahInventoryUpdates.set(productRefInUser.id, {
                      ref: productRefInUser,
                      updates
                    });
                  }
                }
              }

              // Apply inventory updates
              sangrahInventoryUpdates.forEach(({ ref, updates }) => {
                t.update(ref, updates);
              });

              const nikatUpdateObj = {
                status: OrderStatuses.Cancelled,
                updatedAt: firestoreWriteTimestamp
              };
              t.update(
                nikatCustomerSpaceRef.collection('orders').doc(orderId),
                nikatUpdateObj
              );
              t.update(globalNikatAppOrderRef, nikatUpdateObj);
            }
          }
        }

        t.update(transactionRef, transaction.forFirestore('admin'));
        t.update(
          transactionRefInUser,
          transaction.forFirestore('frontend_user')
        );
      }

      return Promise.resolve(transaction);
    })
    .then((transactionResult) => {
      log(transactionResult);
      return defaultSuccessResult;
    });
}
