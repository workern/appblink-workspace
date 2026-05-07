import { HttpsError } from 'firebase-functions/https';
import {
  admin,
  db,
  defaultSuccessResult,
  firestoreWriteTimestamp,
  transactionsByIdCollection
} from '../../global';
import { Transaction } from '../../models/transactions/transaction';
import { TRANSACTION_STATE_PENDING } from '../../constants';
import { log } from 'firebase-functions/logger';
import { messages } from '../../constants/messages';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { TransactionState } from '../../enums/transactions/transaction-state';
import { TransactionReason } from '../../enums/transactions/transaction-reason';


import {
  APPID,
  Amount,
  PurchasableProduct,
  UserSubscription
} from '@workern/models';


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


     
        return defaultSuccessResult;
      
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
