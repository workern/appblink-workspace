import { onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/https';
import { log, error } from 'firebase-functions/logger';
import {
  lemonSqueezySetup,
  createCheckout,
  type NewCheckout,
  Checkout
} from '@lemonsqueezy/lemonsqueezy.js';
import {
  db,
  deployOptions,
  lemonSqueezyApiKey,
  transactionsByIdCollection,
  firestoreWriteTimestamp,
  isProduction,
  REVENUE_CAT_API_KEY
} from '../../global';
import { Transaction } from '../../models/transactions/transaction';
import { TransactionType } from '../../enums/transactions/transaction-type';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TRANSACTION_STATE_PENDING } from '../../constants';
import { Timestamp } from 'firebase-admin/firestore';
import {
  onTransactionSuccessful,
  onTransactionFailed,
  activateAppProductEntitlement,
  revokeAppProductEntitlement
} from './common';
import { Amount } from '@workern/models';
import crypto from 'crypto';
import { getAutoId } from '../../utils';
import { TransactionProcessorID } from '@workern/models';
import { GatewayOrderAndFirestoreEntryResponse } from './types';
// Store ID and Variant ID from Lemon Squeezy dashboard
const LEMONSQUEEZY_STORE_ID = isProduction ? '119118' : '119118'; // Replace with your store ID

/**
 * Creates a Lemon Squeezy checkout session and Firestore transaction entry
 */
export async function createLemonSqueezyCheckoutAndFirestoreEntry(details: {
  amount: Amount;
  notes: Record<string, any>;
  uid: string;
  type: TransactionType;
  reason: TransactionReason;
  description: string;
  customerEmail: string;
  customerName: string;
  productVariantId: string | number;
}): Promise<GatewayOrderAndFirestoreEntryResponse> {
  const {
    amount,
    notes,
    uid,
    type,
    reason,
    description,
    customerEmail,
    customerName
  } = details;

  try {
    // Setup Lemon Squeezy with API key
    lemonSqueezySetup({
      apiKey: isProduction
        ? lemonSqueezyApiKey.value()
        : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIyYjQ2ZGY5ZmMxYTVhNmU5ODFiNGFiYjU2NDdlY2VkZjA2ZjNhM2E3M2I3NDg4ZWIxYjI4MzJiOWFkM2FkYzE5MzU5MDk3NjM4ZjhmMzRiNiIsImlhdCI6MTc3MDE4OTQ0OS4zMzgwMDUsIm5iZiI6MTc3MDE4OTQ0OS4zMzgwMDgsImV4cCI6MTc4NTgwMTYwMC4wMzQ0MDcsInN1YiI6IjMwOTkwMDAiLCJzY29wZXMiOltdfQ.J3dUOYUEXJeeijejxa3jDmaUure1Y4o2UVrxrQll1q5saI_0ENnoLBKIisT_K6iwlF-zsu-d0TqQPNRaBGg_BG3gacLI42ystPljwS1J6iO0OMm5S_YroZPODVc-Rq9iQPqxyy9Qu_qGQ4HLTtCW4Bi4GdaMYDbQ8rak7aCrEn1aHN1LN8x1HFdu73qJBsJAT4WqKZkffr4YwR_iL1aaYkjrAqUK5mdvGHr_0Ms6IVY8kCuaRmlI8li1kvQWxtvor_FKwGaG_HbqghG5nzcWNRkC1dLiNxttca4LDEn2mK5m5GALboskT0J4Zt8Yub3w_DtyVrI0mEaOSzeKqphYtykUIFcsjcMsrPi5IrkrcyfGJ87h6DGwHLB8YIhLCx7NSowLOQls6Es7xE_04VtJ01TkMyq3ycXNTZi3DtTNFveRTb_oHV6N5Y1mmFE7Z7_rrVZC1dEHejrk4Fw-IKZven_Y6MXMIkhjwAXj11yKczwiO7ea41mUQkoRXpLWeynY_hpLQUcrCPj-1U_HY_3dex7InhcPpe3fD2AaAXf_XYOgUcDzU1Ac9GB_Seuyd6G1CV0NO-DcKOaJv5Ds7aRtCv8KIzbzlr0LOpTCJ-asq6DBM3KRH-fKqKKZI7tkxAY7egcWrqDnrHeOhDsrgTQWVglWSXqqb2bNMW5MEOz_sR4',
      onError: (err) => {
        error('Lemon Squeezy setup error:', err);
      }
    });

    // Create transaction in Firestore first
    const transaction = getLemonSqueezyTransaction(
      { amount, notes },
      uid,
      type,
      reason
    );

    // Prepare checkout data
    const checkoutData: NewCheckout = {
      customPrice: amount.value,
      productOptions: {
        name: description,
        description: description,
        redirectUrl: transaction.getRedirectURL()
      },
      checkoutData: {
        email: customerEmail || undefined,
        name: customerName || undefined,
        custom: {
          transactionId: transaction.id,
          websiteId: notes.websiteId,
          uid: uid,
          ...notes
        }
      },
      expiresAt: null,
      checkoutOptions: {
        embed: true
      },
      preview: !isProduction,
      testMode: !isProduction
    };

    // Create checkout session
    const { data: checkoutResponse, error: checkoutError } =
      await createCheckout(
        LEMONSQUEEZY_STORE_ID,
        details.productVariantId,
        checkoutData
      );

    if (checkoutError) {
      error('Lemon Squeezy checkout creation error:', checkoutError);
      throw new HttpsError('internal', 'Failed to create checkout session');
    }

    if (!checkoutResponse?.data?.attributes?.url) {
      throw new HttpsError('internal', 'Checkout URL not received');
    }

    // Update transaction with checkout data
    transaction.processor.data.checkout = checkoutResponse.data;

    // Save transaction to Firestore
    const batch = db.batch();
    batch.set(
      transactionsByIdCollection.doc(transaction.id),
      transaction.forFirestore('admin')
    );
    batch.set(
      db
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .doc(transaction.id),
      transaction.forFirestore('frontend_user')
    );
    await batch.commit();

    log('Created Lemon Squeezy checkout:', {
      transactionId: transaction.id,
      checkoutId: checkoutResponse.data.id,
      websiteId: notes.websiteId
    });

    return {
      gateway: {
        data: checkoutResponse.data,
        name: TransactionProcessorID.LEMON_SQUEEZY
      },
      transaction: transaction,
      success: true
    };
  } catch (err: any) {
    error('Error creating Lemon Squeezy checkout:', err);
    throw new HttpsError(
      'internal',
      err.message || 'Failed to create checkout'
    );
  }
}

/**
 * Create a transaction object for Lemon Squeezy
 */
function getLemonSqueezyTransaction(
  data: {
    amount: Amount;
    notes?: Record<string, any>;
  },
  uid: string,
  type = TransactionType.CREDIT,
  reason = TransactionReason.APP_PRODUCT_PURCHASE
): Transaction {
  const transactionId = getAutoId();

  return new Transaction({
    id: transactionId,
    state: TRANSACTION_STATE_PENDING,
    type: type,
    reason: reason,
    amount: data.amount,
    uid: uid,
    message: '',
    notes: data.notes ?? {},
    processor: {
      id: TransactionProcessorID.LEMON_SQUEEZY,
      data: {}
    },
    createdAt: Timestamp.now()
  });
}

/**
 * Webhook handler for Lemon Squeezy events
 */
export const webHookHandler = onRequest(
  {
    ...deployOptions,
    memory: '512MiB',
    region: 'asia-south2',
    secrets: [lemonSqueezyApiKey, REVENUE_CAT_API_KEY]
  },
  async (req, res) => {
    try {
      const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

      if (!signature) {
        log('Missing signature header');
        res.status(400).send('Missing signature');
        return;
      }
      const secret = 'shambho';
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(
        hmac.update(req.rawBody).digest('hex'),
        'utf8'
      );

      if (!crypto.timingSafeEqual(digest, signature)) {
        throw new Error('Invalid signature.');
      }

      const event = req.body;
      log('Lemon Squeezy webhook event:', event.meta?.event_name);
      log('full event', event);
      const eventName = event.meta?.event_name;
      const notes = event.meta?.custom_data;
      const transactionId = notes?.transaction_id;

      // ── Subscription lifecycle events ─────────────────────────────────────
      // These are fired by LemonSqueezy for recurring subscriptions.
      // They don't carry a transactionId — resolve uid/appId/entitlementId
      // from meta.custom_data written at original checkout creation.
      // LemonSqueezy converts camelCase keys to snake_case in custom_data.
      const SUBSCRIPTION_ACTIVATE_EVENTS = new Set([
        'subscription_payment_success',
        'subscription_resumed'
      ]);
      const SUBSCRIPTION_REVOKE_EVENTS = new Set(['subscription_expired']);
      const SUBSCRIPTION_LOG_EVENTS = new Set([
        'subscription_cancelled',
        'subscription_paused'
      ]);

      if (
        SUBSCRIPTION_ACTIVATE_EVENTS.has(eventName) ||
        SUBSCRIPTION_REVOKE_EVENTS.has(eventName) ||
        SUBSCRIPTION_LOG_EVENTS.has(eventName)
      ) {
        const subUid = notes?.uid as string | undefined;
        const subAppId = notes?.app_id as string | undefined;
        const subEntitlementId = notes?.entitlement_id as string | undefined;

        if (!subUid || !subAppId || !subEntitlementId) {
          log(
            `LemonSqueezy subscription event missing uid/appId/entitlementId — skipping`,
            { eventName, notes }
          );
          res.status(200).send({ handled: false, reason: 'missing_context' });
          return;
        }

        if (SUBSCRIPTION_ACTIVATE_EVENTS.has(eventName)) {
          await activateAppProductEntitlement({
            uid: subUid,
            notes: { appId: subAppId, entitlementId: subEntitlementId }
          });
          log(
            `Subscription ACTIVATED via ${eventName} | uid=${subUid} appId=${subAppId} entitlementId=${subEntitlementId}`
          );
        } else if (SUBSCRIPTION_REVOKE_EVENTS.has(eventName)) {
          await revokeAppProductEntitlement({
            uid: subUid,
            notes: { appId: subAppId, entitlementId: subEntitlementId },
            reason: eventName
          });
          log(
            `Subscription REVOKED via ${eventName} | uid=${subUid} appId=${subAppId} entitlementId=${subEntitlementId}`
          );
        } else {
          log(
            `Subscription event logged (no access change): ${eventName} | uid=${subUid}`
          );
        }

        res.status(200).send({ handled: true, type: eventName });
        return;
      }

      // ── Order events (require transactionId) ─────────────────────────────
      if (transactionId) {
        // Handle order_created event (successful payment)
        if (eventName === 'order_created') {
          // Get transaction from Firestore
          const transactionDoc = await transactionsByIdCollection
            .doc(transactionId)
            .get();

          if (!transactionDoc.exists) {
            log('Transaction not found:', transactionId);
            res.status(404).send('Transaction not found');
            return;
          }

          const transaction = new Transaction(
            transactionDoc.data() as Transaction
          );

          if (transaction.state !== TRANSACTION_STATE_PENDING) {
            log('Transaction already processed:', transactionId);
            res.status(200).send('Transaction already processed');
            return;
          }

          // Process successful payment
          await onTransactionSuccessful(transaction, event);

   
    

          log('Payment processed successfully:', transactionId);
          res.status(200).send({ success: true });
        }
        // Handle order_refunded event (failed payment or refund)
        else if (eventName === 'order_refunded') {
          const transactionDoc = await transactionsByIdCollection
            .doc(transactionId)
            .get();

          if (!transactionDoc.exists) {
            log('Transaction not found for refund:', transactionId);
            res.status(404).send('Transaction not found');
            return;
          }

          const transaction = new Transaction(
            transactionDoc.data() as Transaction
          );

          await onTransactionFailed(transaction, event);

          log('Refund processed:', transactionId);
          res.status(200).send({ success: true });
        } else {
          log('Unhandled order event type:', eventName);
          res.status(200).send('Event not handled');
        }
      } else {
        log('Unhandled event with no transactionId:', eventName);
        res.status(200).send({ handled: false, reason: 'no_transaction_id' });
      }
    } catch (err: any) {
      error('Error processing Lemon Squeezy webhook:', err);
      res.status(500).send('Internal server error');
    }
  }
);
