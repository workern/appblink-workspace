import { error, log, logger } from 'firebase-functions/logger';
import {
  deployOptions,
  isProduction,
  transactionsByIdCollection,
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
  rtdb,
  db,
  functionsBaseURL,
  REVENUE_CAT_API_KEY
} from '../../global';
import { HttpsError } from 'firebase-functions/v1/https';
import {
  CallableRequest,
  onCall,
  onRequest
} from 'firebase-functions/v2/https';
import { TRANSACTION_STATE_PENDING } from '../../constants';
import { messages } from '../../constants/messages';
import { getAutoId, getUser } from '../../utils';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
import { Transaction } from '../../models/transactions/transaction';
import {
  activateAppProductEntitlement,
  onTransactionFailed,
  onTransactionSuccessful,
  revokeAppProductEntitlement,
  upsertUserSubscriptionDoc
} from './common';

import { TransactionType } from '../../enums/transactions/transaction-type';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TransactionProcessorID } from '@workern/models';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { checkRequest, getCurrencyDataFromRequest, convertUSDToINR } from '../../utils';
import { Amount } from '@workern/models';
import { GatewayOrderAndFirestoreEntryResponse } from './types';
const Razorpay = require('razorpay');
interface OrderCreateResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: 'INR';
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: any;
  created_at: number;
}

interface SubscriptionCreateResponse {
  id: string;
  entity: 'subscription';
  plan_id: string;
  status:
    | 'created'
    | 'authenticated'
    | 'active'
    | 'pending'
    | 'halted'
    | 'cancelled'
    | 'completed'
    | 'expired';
  current_start: number | null;
  current_end: number | null;
  ended_at: number | null;
  quantity: number;
  notes: any;
  charge_at: number | null;
  start_at: number | null;
  end_at: number | null;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: number;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  source: string;
  offer_id: string | null;
  remaining_count: number;
}
export const razorpayProducts = {
  US: {
    monthly: isProduction ? 'plan_DdU6JfwqiHaGIh' : 'item_NfVngzKTWlkZCj',
    annual: isProduction ? 'plan_I5kO4OevcvHf22' : 'item_NfVpWjLhecoM2X'
  },
  IN: {
    monthly: isProduction ? 'item_NXvpRFCPCOG8NQ' : 'item_NfVl8kBgjZiQqb',
    annual: isProduction ? 'plan_I5kKmshOoAOF2y' : 'item_NfVmHsZt6Sfa20'
  }
};

exports.createOrder = onCall(
  {
    ...deployOptions,
    // minInstances: 1,
    memory: '512MiB',
    secrets: [razorpayKeyId, razorpayKeySecret]
  },
  async (request) => {
    const schema = z.object({
      taskId: z.string(),
      spaceId: z.string(),
      amount: z.number().min(100),
      langCode: z.string().optional()
    });
    checkRequest(request, schema, true);
    const data = request.data;
    const uid = request.auth.uid;

    if (data.amount < 100) {
      throw new HttpsError('invalid-argument', 'Invalid amount');
    }

    data.langCode = data.langCode || 'en';
    data.amount = {
      value: Math.round(data.amount),
      currency: 'USD',
      symbol: '$'
    };
    data.source = 'workernFreelanceApp';
    data.context = request;
    const order = await createOrderForBalanceTopup(data, uid);
    return order;
  }
);

export async function createOrderForBalanceTopup(
  data: {
    taskId?: string;
    spaceId?: string;
    productId?: string;
    amount: Amount;
    langCode: string;
    source: 'workernLeadsApp' | 'workernFreelanceApp';
    context: CallableRequest;
  },
  uid: string
) {
  const currencyData = await getCurrencyDataFromRequest(data.context);
  const locationAwareAmount =
    data.amount.currency == 'USD' && currencyData?.currency == 'INR'
      ? convertUSDToINR(data.amount)
      : data.amount;
  const notes: any = {
    uid: uid,
    ...(data.taskId && { taskId: data.taskId }),
    ...(data.spaceId && { spaceId: data.spaceId }),
    ...(data.productId && { productId: data.productId }),
    source: data.source || 'workernFreelanceApp'
  };
  const transactionData = {
    amount: data.amount,
    notes: {
     
      ...(data.productId && { productId: data.productId }),
      source: data.source
    }
  };

  try {
    const user = await getUser(uid);
    const transaction = getRazorpayTransaction(transactionData, uid);
    notes.transactionId = transaction.id;
    const order = await createRazorpayOrder(locationAwareAmount, notes);
    if (order.status == 'created') {
      transaction.processor.data.order = order;
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
      return {
        key: isProduction ? razorpayKeyId.value() : 'rzp_test_Rm3ZpwsyNst8nl',
        amount: order.amount_due,
        currency: order.currency,
        name: 'Workern',
        description: `Deposit of ${data.amount.symbol}${data.amount.value / 100}`,
        image: 'https://workern-assets.b-cdn.net/workern_logo.png',
        order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        callback_url: `${functionsBaseURL}/razorpay-verifyPayment`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber
        },
        notes: notes,
        theme: {
          color: '#3399cc'
        }
      };
    } else {
      throw new HttpsError(
        'internal',
        messages[data.langCode].order.errorCreating
      );
    }
  } catch (err: any) {
    log('Error creating Razorpay order', err.message);
    throw new HttpsError(
      'internal',
      messages[data.langCode].order.errorCreating
    );
  }
}

exports.verifyPayment = onRequest(
  {
    ...deployOptions,
    memory: '512MiB',
    // minInstances: 1,
    region: 'asia-south2',
    secrets: [razorpayKeyId, razorpayKeySecret, REVENUE_CAT_API_KEY]
  },
  async (req, res) => {
    const referer = req.headers['referer'] || 'No referer';
    log('Request came from:', referer);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    console.log('Razorpay verify payment body:', req.body);
    const secret = isProduction
      ? razorpayKeySecret.value()
      : 'bKqN5kUJ8wmXx5d0RBkS4NXI';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    try {
      const isValidSignature = validateWebhookSignature(
        body,
        razorpay_signature,
        secret
      );
      log('Is valid signature', isValidSignature);
      if (isValidSignature) {
        // Update the order with payment details
        const transactions = (
          await transactionsByIdCollection
            .where('processor.data.order.entity.id', '==', razorpay_order_id)
            .get()
        ).docs;

        if (transactions.length == 1) {
          const transactionSnap = transactions[0];
          const transaction = new Transaction(
            transactionSnap.data() as Transaction
          );

          await onTransactionSuccessful(transaction, req.body);

          const redirectUrl = transaction.getRedirectURL();

          res.redirect(redirectUrl);
        }

        log('Payment verification successful');
      } else {
        res.status(400).json({ status: 'verification_failed' });
        log('Payment verification failed');
      }
    } catch (err) {
      error(err);
      res
        .status(500)
        .json({ status: 'error', message: 'Error verifying payment' });
    }
  }
);

exports.webHookHandler = onRequest(
  {
    ...deployOptions,
    // minInstances: 1,
    memory: '512MiB',
    region: 'asia-south2',
    secrets: [razorpayWebhookSecret, REVENUE_CAT_API_KEY]
  },
  async (req, res) => {
    const data = req.body;
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (
      !Razorpay.validateWebhookSignature(
        rawBody.toString(),
        signature,
        razorpayWebhookSecret.value()
      )
    ) {
      log('Failed to validate webhook signature');
      res.status(400).send('Invalid signature');
      return Promise.resolve();
    }

    const handleOrderPaid = async () => {
      const orderPayload = data?.payload?.order?.entity;
      const paymentPayload = data?.payload?.payment?.entity;

      const notes = orderPayload?.notes || paymentPayload?.notes || {};

      if (notes?.transactionId) {
        const transaction = new Transaction(
          (
            await transactionsByIdCollection.doc(notes.transactionId).get()
          ).data()
        );
        if (transaction.state === TRANSACTION_STATE_PENDING) {
          const result = await onTransactionSuccessful(
            transaction,
            data.payload
          );

          // Update website sender information if websiteId exists
          if (notes.websiteId && notes.source === 'eGiftsApp') {
            const buyerEmail = paymentPayload?.email || '';
            const buyerName = paymentPayload?.notes?.name || '';

            if (buyerEmail || buyerName) {
              const websiteRef = db.doc(
                `apps/eGiftsApp/customWebsites/${notes.websiteId}`
              );
              const userWebsiteRef = db.doc(
                `users/${transaction.uid}/mySpaces/eGiftsApp/valentineWebsites/${notes.websiteId}`
              );

              const updateData: any = {};
              if (buyerEmail) updateData['sender.email'] = buyerEmail;
              if (buyerName) updateData['sender.name'] = buyerName;

              const batch = db.batch();
              batch.update(websiteRef, updateData);
              batch.update(userWebsiteRef, updateData);
              await batch.commit();

              log('Updated website sender info:', {
                websiteId: notes.websiteId,
                buyerEmail,
                buyerName
              });
            }
          }

          if (result?.successful) {
            log('Successfully handled successful transaction.');
            res.status(200).send({ successful: true });
            return Promise.resolve();
          } else {
            log('Failed to update one-time purchase');
            throw new Error('Failed to update one-time purchase');
          }
        } else {
          await transactionsByIdCollection.doc(notes.transactionId).update({
            'processor.data.order': orderPayload,
            'processor.data.payment': data.payload.payment || null
          });
          log('Transaction already processed. Updated processor data.');
          res.status(200).send({ successful: true });
          return Promise.resolve();
        }
      } else {
        log(
          'Payment link paid but data does not contain payment or payment link'
        );
        res.status(400).send('Invalid payment link data');
        return Promise.resolve();
      }
    };

    const handleRefundProcessed = async () => {
      const paymentID = data?.payload?.refund?.entity?.payment_id;

      if (typeof paymentID !== 'string') {
        throw new Error('Invalid payment ID');
      }

      const snap = await rtdb
        .ref('razorpayOneTimePurchasesByPaymentID')
        .child(paymentID)
        .once('value');

      if (!snap.exists()) {
        throw new Error('Payment ID not found');
      }

      const notes = snap
        .child('payment_link')
        .child('entity')
        .child('notes')
        .val();

      if (
        notes?.UID1 &&
        notes.UID1.indexOf(',') === -1 &&
        notes.UID1.length > 0 &&
        notes.plan
      ) {
        log('Cancelling Razorpay purchase as refund processed.');
        await Promise.resolve({ successful: true }); //TODO: Cancel one-time purchase for Razorpay
        res.status(200).send({ successful: true });
      } else {
        throw new Error('Invalid notes data');
      }
    };

    const handlePaymentFailed = async () => {
      const orderPayload = data?.payload?.order?.entity;

      const notes = orderPayload?.notes;

      if (notes.transactionId) {
        const transaction = new Transaction(
          (
            await transactionsByIdCollection.doc(notes.transactionId).get()
          ).data()
        );
        if (transaction.state === TRANSACTION_STATE_PENDING) {
          const result = await onTransactionFailed(transaction, data.payload);

          if (result?.successful) {
            log('Successfully handled failed transaction.');
            res.status(200).send({ successful: true });
            return Promise.resolve();
          } else {
            log('Failed to update one-time purchase');
            throw new Error('Failed to update one-time purchase');
          }
        } else {
          await transactionsByIdCollection.doc(notes.transactionId).update({
            'processor.data.order': orderPayload,
            'processor.data.payment': data.payload.payment || null
          });
          log('Transaction already processed. Updated processor data.');
          res.status(200).send({ successful: true });
          return Promise.resolve();
        }
      } else {
        log(
          'Payment link paid but data does not contain payment or payment link'
        );
        res.status(400).send('Invalid payment link data');
        return Promise.resolve();
      }
    };

    try {
      switch (data.event) {
        case 'order.paid':
          await handleOrderPaid();
          break;
        case 'refund.processed':
          await handleRefundProcessed();
          break;
        case 'payment.failed':
        case 'order.notification.failed':
          // Handle payment failed event if needed
          await handlePaymentFailed();
          res.status(200).send('Event received');
          break;
        case 'subscription.charged': {
          // Every billing cycle is a real money movement — create a NEW transaction
          // for each charge. Use Razorpay's payment ID as the dedup key.
          const subscriptionPayload = data?.payload?.subscription?.entity;
          const paymentPayload = data?.payload?.payment?.entity;
          const subscriptionNotes = subscriptionPayload?.notes ?? {};
          const originalTransactionId = subscriptionNotes.transactionId;
          const razorpayPaymentId = paymentPayload?.id;

          if (!originalTransactionId) {
            log('subscription.charged: no transactionId in notes');
            res.status(400).send('Missing transactionId in subscription notes');
            return Promise.resolve();
          }

          // Idempotency: skip if we already created a transaction for this payment ID.
          if (razorpayPaymentId) {
            const existing = await transactionsByIdCollection
              .where('processor.data.payment.id', '==', razorpayPaymentId)
              .limit(1)
              .get();
            if (!existing.empty) {
              log(
                'subscription.charged: payment already processed',
                razorpayPaymentId
              );
              res.status(200).send({ successful: true });
              return Promise.resolve();
            }
          }

          // Fetch the enrollment transaction to inherit notes (appId, productId, uid, etc.)
          const enrollmentTxSnap = await transactionsByIdCollection
            .doc(originalTransactionId)
            .get();
          if (!enrollmentTxSnap.exists) {
            log(
              'subscription.charged: enrollment transaction not found',
              originalTransactionId
            );
            res.status(404).send('Enrollment transaction not found');
            return Promise.resolve();
          }

          const enrollmentTx = new Transaction(enrollmentTxSnap.data());

          const chargeAmount: Amount = paymentPayload?.amount
            ? {
                value: paymentPayload.amount,
                currency: paymentPayload.currency || 'INR',
                symbol: paymentPayload.currency === 'USD' ? '$' : '₹'
              }
            : enrollmentTx.amount;

          // ── First charge dedup ─────────────────────────────────────────────
          // Razorpay fires both `subscription.activated` AND `subscription.charged`
          // for the very first payment. `subscription.activated` already marks the
          // enrollment transaction as SUCCESSFUL, so we must not create a second
          // transaction here for paid_count === 1.
          if (subscriptionPayload?.paid_count === 1) {
            // Attach payment data to the enrollment transaction so billing
            // history shows the payment ID, then update the subscription doc.
            await transactionsByIdCollection.doc(originalTransactionId).update({
              'processor.data.payment': paymentPayload,
              'processor.data.subscription': subscriptionPayload
            });
            await upsertUserSubscriptionDoc({
              enrollmentTransactionId: originalTransactionId,
              uid: enrollmentTx.uid,
              appId: enrollmentTx.notes.appId,
              productId: enrollmentTx.notes.productId,
              entitlementId: enrollmentTx.notes.entitlementId,
              amount: chargeAmount,
              subscriptionEntity: subscriptionPayload
            });
            log(
              'subscription.charged: first charge — updated enrollment tx, skipped new transaction',
              originalTransactionId
            );
            res.status(200).send({ successful: true });
            return Promise.resolve();
          }
          // ──────────────────────────────────────────────────────────────────

          // Build the charge transaction inheriting notes so entitlement logic
          // in onTransactionSuccessful has access to appId, productId, etc.
          const chargeNotes = {
            ...enrollmentTx.notes,
            subscriptionTransactionId: originalTransactionId,
            subscriptionId: subscriptionPayload?.id,
            razorpayPaymentId
          };

          const chargeTx = getRazorpayTransaction(
            { amount: chargeAmount, notes: chargeNotes },
            enrollmentTx.uid,
            TransactionType.CREDIT,
            TransactionReason.SUBSCRIPTION_PAYMENT
          );

          // Persist the new charge transaction to both Firestore paths.
          const chargeBatch = db.batch();
          chargeBatch.set(transactionsByIdCollection.doc(chargeTx.id), {
            ...chargeTx.forFirestore('admin'),
            processor: {
              id: TransactionProcessorID.RAZORPAY,
              data: {
                payment: paymentPayload,
                subscription: subscriptionPayload
              }
            }
          });
          chargeBatch.set(
            db
              .collection('users')
              .doc(enrollmentTx.uid)
              .collection('transactions')
              .doc(chargeTx.id),
            {
              ...chargeTx.forFirestore('frontend_user'),
              processor: { id: TransactionProcessorID.RAZORPAY, data: {} }
            }
          );
          await chargeBatch.commit();

          // Keep the UserSubscription doc up-to-date with latest cycle dates.
          await upsertUserSubscriptionDoc({
            enrollmentTransactionId: originalTransactionId,
            uid: enrollmentTx.uid,
            appId: enrollmentTx.notes.appId,
            productId: enrollmentTx.notes.productId,
            entitlementId: enrollmentTx.notes.entitlementId,
            amount: chargeAmount,
            subscriptionEntity: subscriptionPayload
          });

          const chargeResult = await onTransactionSuccessful(
            chargeTx,
            data.payload
          );
          if (chargeResult?.successful) {
            log(
              'subscription.charged: new charge transaction processed',
              chargeTx.id
            );
            res.status(200).send({ successful: true });
          } else {
            throw new Error(
              'subscription.charged: onTransactionSuccessful returned failure'
            );
          }
          break;
        }
        case 'subscription.activated':
        case 'subscription.authenticated': {
          // Mark the enrollment transaction as successful so we know the subscription
          // is live. Subsequent charges will each create their own transaction.
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          if (subNotes.transactionId) {
            const enrollSnap = await transactionsByIdCollection
              .doc(subNotes.transactionId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              if (enrollTx.state === TRANSACTION_STATE_PENDING) {
                await onTransactionSuccessful(enrollTx, data.payload);
              } else {
                // Already finalised – just keep processor data fresh.
                await transactionsByIdCollection
                  .doc(subNotes.transactionId)
                  .update({ 'processor.data.subscription': subEntity });
              }
              await upsertUserSubscriptionDoc({
                enrollmentTransactionId: subNotes.transactionId,
                uid: enrollTx.uid,
                appId: enrollTx.notes.appId,
                productId: enrollTx.notes.productId,
                entitlementId: enrollTx.notes.entitlementId,
                amount: enrollTx.amount,
                subscriptionEntity: subEntity
              });
            }
          }
          log(`${data.event}: enrollment transaction finalised`);
          res.status(200).send({ successful: true });
          break;
        }
        // ── Revoke access ─────────────────────────────────────────────────────
        case 'subscription.halted':
        // Razorpay retried 3 times and all failed – subscription is frozen.
        case 'subscription.cancelled':
        // User or merchant explicitly cancelled.
        case 'subscription.completed': {
          // All billing cycles exhausted – subscription naturally ended.
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          const enrollmentId = subNotes.transactionId;

          if (enrollmentId) {
            await transactionsByIdCollection.doc(enrollmentId).update({
              'processor.data.subscription': subEntity,
              'processor.data.subscriptionStatus':
                subEntity?.status ?? data.event
            });

            // Revoke entitlement – user no longer has active access.
            const enrollSnap = await transactionsByIdCollection
              .doc(enrollmentId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              await revokeAppProductEntitlement({
                uid: enrollTx.uid,
                notes: enrollTx.notes,
                reason: subEntity?.status ?? data.event
              });
              // Delete the subscription doc so the UI shows the plans screen
              // and re-subscription starts with a clean document (no stale fields).
              const subDocRef = db
                .collection('users')
                .doc(enrollTx.uid)
                .collection('mySpaces')
                .doc(enrollTx.notes.appId)
                .collection('subscriptions')
                .doc(enrollTx.notes.productId);
              await subDocRef.delete();
            }
          }
          log(`${data.event}: entitlement revoked`);
          res.status(200).send({ successful: true });
          break;
        }

        // ── Pause / resume ────────────────────────────────────────────────────
        case 'subscription.paused': {
          // Subscription manually paused via Razorpay API.
          // Revoke entitlement until it is resumed.
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          const enrollmentId = subNotes.transactionId;

          if (enrollmentId) {
            await transactionsByIdCollection.doc(enrollmentId).update({
              'processor.data.subscription': subEntity,
              'processor.data.subscriptionStatus': 'paused'
            });

            const enrollSnap = await transactionsByIdCollection
              .doc(enrollmentId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              await revokeAppProductEntitlement({
                uid: enrollTx.uid,
                notes: enrollTx.notes,
                reason: 'paused'
              });
              await upsertUserSubscriptionDoc({
                enrollmentTransactionId: enrollmentId,
                uid: enrollTx.uid,
                appId: enrollTx.notes.appId,
                productId: enrollTx.notes.productId,
                entitlementId: enrollTx.notes.entitlementId,
                amount: enrollTx.amount,
                subscriptionEntity: subEntity
              });
            }
          }
          log('subscription.paused: entitlement revoked');
          res.status(200).send({ successful: true });
          break;
        }

        case 'subscription.resumed': {
          // Subscription unpaused – re-grant access without creating a new
          // charge transaction (no payment happened here).
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          const enrollmentId = subNotes.transactionId;

          if (enrollmentId) {
            await transactionsByIdCollection.doc(enrollmentId).update({
              'processor.data.subscription': subEntity,
              'processor.data.subscriptionStatus': 'active'
            });

            const enrollSnap = await transactionsByIdCollection
              .doc(enrollmentId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              await activateAppProductEntitlement({
                uid: enrollTx.uid,
                notes: enrollTx.notes
              });
              await upsertUserSubscriptionDoc({
                enrollmentTransactionId: enrollmentId,
                uid: enrollTx.uid,
                appId: enrollTx.notes.appId,
                productId: enrollTx.notes.productId,
                entitlementId: enrollTx.notes.entitlementId,
                amount: enrollTx.amount,
                subscriptionEntity: subEntity
              });
            }
          }
          log('subscription.resumed: entitlement restored');
          res.status(200).send({ successful: true });
          break;
        }

        // ── Informational ─────────────────────────────────────────────────────
        case 'subscription.pending': {
          // A charge is being queued / retried. No state change on our side.
          // You can safely UNCHECK this event in the Razorpay dashboard unless
          // you want to show a "payment processing" state in the UI.
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          if (subNotes.transactionId) {
            await transactionsByIdCollection
              .doc(subNotes.transactionId)
              .update({
                'processor.data.subscription': subEntity,
                'processor.data.subscriptionStatus': 'pending'
              });
            const enrollSnap = await transactionsByIdCollection
              .doc(subNotes.transactionId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              await upsertUserSubscriptionDoc({
                enrollmentTransactionId: subNotes.transactionId,
                uid: enrollTx.uid,
                appId: enrollTx.notes.appId,
                productId: enrollTx.notes.productId,
                entitlementId: enrollTx.notes.entitlementId,
                amount: enrollTx.amount,
                subscriptionEntity: subEntity
              });
            }
          }
          log(
            'subscription.pending: processor data updated (no entitlement change)'
          );
          res.status(200).send({ successful: true });
          break;
        }

        case 'subscription.updated': {
          // Plan / quantity / dates changed via Razorpay API. Just keep
          // processor data fresh. You can safely UNCHECK this event if you
          // never change plans via the Razorpay API.
          const subEntity = data?.payload?.subscription?.entity;
          const subNotes = subEntity?.notes ?? {};
          if (subNotes.transactionId) {
            await transactionsByIdCollection
              .doc(subNotes.transactionId)
              .update({
                'processor.data.subscription': subEntity
              });
            const enrollSnap = await transactionsByIdCollection
              .doc(subNotes.transactionId)
              .get();
            if (enrollSnap.exists) {
              const enrollTx = new Transaction(enrollSnap.data());
              await upsertUserSubscriptionDoc({
                enrollmentTransactionId: subNotes.transactionId,
                uid: enrollTx.uid,
                appId: enrollTx.notes.appId,
                productId: enrollTx.notes.productId,
                entitlementId: enrollTx.notes.entitlementId,
                amount: enrollTx.amount,
                subscriptionEntity: subEntity
              });
            }
          }
          log('subscription.updated: processor data updated');
          res.status(200).send({ successful: true });
          break;
        }

        default:
          log('Event not being listened for', data.event);
          res.status(400).send('Event not being listened for');
      }
    } catch (err) {
      log('Error handling event', err);
      res.status(500).send('Error handling event');
    }
  }
);

export function createRazorpayOrder(
  amount: { value: number; currency: string; symbol: string },
  notes: any
): Promise<OrderCreateResponse> {
  const orderId = transactionsByIdCollection.doc().id;
  const instance = new Razorpay({
    key_id: isProduction ? razorpayKeyId.value() : 'rzp_test_Rm3ZpwsyNst8nl',
    key_secret: isProduction
      ? razorpayKeySecret.value()
      : 'bKqN5kUJ8wmXx5d0RBkS4NXI'
  });

  return instance.orders.create({
    amount: amount.value,
    currency: amount.currency,
    receipt: orderId,
    notes: notes
  });
}

/**
 * Creates a Razorpay subscription for a given plan.
 */
export function createRazorpaySubscription(details: {
  planId: string;
  totalCount: number;
  quantity?: number;
  notes?: any;
  startAt?: number;
  expireBy?: number;
  customerNotify?: boolean;
}): Promise<SubscriptionCreateResponse> {
  const {
    planId,
    totalCount,
    quantity = 1,
    notes = {},
    startAt,
    expireBy,
    customerNotify = true
  } = details;

  const instance = new Razorpay({
    key_id: isProduction ? razorpayKeyId.value() : 'rzp_test_Rm3ZpwsyNst8nl',
    key_secret: isProduction
      ? razorpayKeySecret.value()
      : 'bKqN5kUJ8wmXx5d0RBkS4NXI'
  });

  const payload: Record<string, any> = {
    plan_id: planId,
    total_count: totalCount,
    quantity: quantity,
    customer_notify: customerNotify ? 1 : 0,
    notes: notes
  };

  if (startAt) payload.start_at = startAt;
  if (expireBy) payload.expire_by = expireBy;

  logger.info('Creating Razorpay subscription with payload:', payload);
  return instance.subscriptions.create(payload);
}

/**
 * Creates a Razorpay subscription AND saves a pending transaction record to
 * Firestore (both in the global `transactions` collection and the user's personal
 * transactions sub-collection).  The returned object contains all data needed by
 * the frontend to complete the checkout flow.
 */
export async function createRazorpaySubscriptionAndFirestoreEntry(details: {
  planId: string;
  totalCount: number;
  quantity?: number;
  /** Per-cycle amount (for the transaction record – fetch from plan if needed). */
  amount: Amount;
  notes: any;
  uid: string;
  reason?: TransactionReason;
  description: string;
  logoUrl: string;
  appName: string;
  startAt?: number;
  expireBy?: number;
  customerNotify?: boolean;
  type: TransactionType;
}): Promise<GatewayOrderAndFirestoreEntryResponse> {
  const langCode = 'en';
  const {
    planId,
    totalCount,
    quantity = 1,
    amount,
    notes,
    uid,
    reason = TransactionReason.SUBSCRIPTION_PAYMENT,
    description,
    logoUrl,
    appName,
    startAt,
    expireBy,
    customerNotify
  } = details;

  try {
    const notesForRazorpay: any = { uid, ...notes };
    const user = await getUser(uid);

    // Build a pending transaction record.
    const transaction = getRazorpayTransaction(
      { amount, notes },
      uid,
      TransactionType.CREDIT,
      reason
    );
    notesForRazorpay.transactionId = transaction.id;

    const subscriptionResponse = await createRazorpaySubscription({
      planId,
      totalCount,
      quantity,
      notes: notesForRazorpay,
      startAt,
      expireBy,
      customerNotify
    });
    log('Razorpay subscription creation response', subscriptionResponse);
    if (
      subscriptionResponse.status === 'created' ||
      subscriptionResponse.status === 'authenticated'
    ) {
      transaction.processor.data.subscription = subscriptionResponse;

      const batch = db.batch();

      // Global transactions collection.
      batch.set(transactionsByIdCollection.doc(transaction.id), {
        ...transaction.forFirestore('admin'),
        processor: {
          id: TransactionProcessorID.RAZORPAY,
          data: { subscription: subscriptionResponse }
        }
      });

      // User's personal transactions collection.
      batch.set(
        db
          .collection('users')
          .doc(uid)
          .collection('transactions')
          .doc(transaction.id),
        {
          ...transaction.forFirestore('frontend_user'),
          processor: {
            id: TransactionProcessorID.RAZORPAY,
            data: { subscription: subscriptionResponse }
          }
        }
      );

      await batch.commit();

      // Write the initial UserSubscription doc so the frontend billing section
      // can show the plan + status immediately after checkout.
      await upsertUserSubscriptionDoc({
        enrollmentTransactionId: transaction.id,
        uid,
        appId: notes.appId,
        productId: notes.productId,
        entitlementId: notes.entitlementId,
        amount,
        subscriptionEntity: subscriptionResponse
      });

      return {
        gateway: {
          name: TransactionProcessorID.RAZORPAY,
          data: {
            key: isProduction
              ? razorpayKeyId.value()
              : 'rzp_test_Rm3ZpwsyNst8nl',
            subscription_id: subscriptionResponse.id,
            short_url: subscriptionResponse.short_url,
            name: appName,
            description,
            image: logoUrl,
            prefill: {
              name: user?.name || undefined,
              email: user?.email || undefined,
              contact: user?.phoneNumber || undefined
            },
            notes: notesForRazorpay,
            theme: { color: '#3399cc' }
          }
        },
        transaction,
        success: true
      };
    } else {
      throw new HttpsError('internal', messages[langCode].order.errorCreating);
    }
  } catch (err: any) {
    log('Error creating Razorpay subscription', err);
    throw new HttpsError('internal', messages[langCode].order.errorCreating);
  }
}

export async function createRazorpayOrderAndFirestoreEntry(details: {
  amount: Amount;
  notes: any;
  uid: string;
  type: TransactionType;
  reason: TransactionReason;
  description: string;
  logoUrl: string;
  appName: string;
  removeCallbackUrl?: boolean;
}): Promise<GatewayOrderAndFirestoreEntryResponse> {
  const langCode = 'en';
  const {
    amount,
    notes,
    uid,
    type,
    reason,
    description,
    logoUrl,
    appName,
    removeCallbackUrl
  } = details;
  try {
    const transactionData: { amount: Amount; notes: any } = {
      amount: amount,
      notes: notes
    };
    const notesForRazorpay: any = {
      uid: uid,
      ...notes
    };
    const user = await getUser(uid);
    const transaction = getRazorpayTransaction(
      transactionData,
      uid,
      type,
      reason
    );
    notesForRazorpay.transactionId = transaction.id;
    const orderCreationResponse = await createRazorpayOrder(
      transactionData.amount,
      notesForRazorpay
    );

    if (orderCreationResponse.status == 'created') {
      transaction.processor.data.order = { entity: orderCreationResponse };
      const batch = db.batch();

      // Save transaction with processor.data explicitly set
      const transactionForFirestore = transaction.forFirestore('admin');
      batch.set(transactionsByIdCollection.doc(transaction.id), {
        ...transactionForFirestore,
        processor: {
          id: TransactionProcessorID.RAZORPAY,
          data: {
            order: { entity: orderCreationResponse }
          }
        }
      });

      const transactionForUser = transaction.forFirestore('frontend_user');
      batch.set(
        db
          .collection('users')
          .doc(uid)
          .collection('transactions')
          .doc(transaction.id),
        {
          ...transactionForUser,
          processor: {
            id: TransactionProcessorID.RAZORPAY,
            data: {
              order: { entity: orderCreationResponse }
            }
          }
        }
      );
      await batch.commit();

      return {
        gateway: {
          name: TransactionProcessorID.RAZORPAY,
          data: {
            key: isProduction
              ? razorpayKeyId.value()
              : 'rzp_test_Rm3ZpwsyNst8nl',
            amount: orderCreationResponse.amount_due, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            currency: orderCreationResponse.currency,
            name: appName,
            description: description,
            image: logoUrl,
            order_id: orderCreationResponse.id,
            prefill: {
              name: user?.name || undefined,
              email: user?.email || undefined,
              contact: user?.phoneNumber || undefined
            },
            notes: notesForRazorpay,
            theme: {
              color: '#3399cc'
            },
            ...(removeCallbackUrl
              ? {}
              : { callback_url: `${functionsBaseURL}/razorpay-verifyPayment` })
          }
        },
        transaction: transaction,
        success: true
      };
    } else {
      throw new HttpsError('internal', messages[langCode].order.errorCreating);
    }
  } catch (err: any) {
    log('Error creating Razorpay order', err.message);
    throw new HttpsError('internal', messages[langCode].order.errorCreating);
  }
}

export function getRazorpayTransaction(
  data: {
    amount: Amount;
    notes?: Record<string, any>;
  },
  uid: string,
  type = TransactionType.CREDIT,
  reason = TransactionReason.DEPOSIT
): Transaction {
  const transactionId = getAutoId();
  console.log('notes in getRazorpayTransaction', data.notes);
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
      id: TransactionProcessorID.RAZORPAY,
      data: {}
    },
    createdAt: Timestamp.now()
  });
}

export class RazorpayUtils {}
