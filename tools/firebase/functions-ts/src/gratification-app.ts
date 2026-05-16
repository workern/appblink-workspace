import { firestore } from 'firebase-admin';
import { log, error } from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/https';
import {
  DEDUCTION_MULTIPLIER,
  TRANSACTION_PROCESSOR_RAZORPAY_X
} from './constants';
import { getAutoId, createPayoutLink, checkRequest } from './utils';
import {
  db,
  transactionsByIdCollection,
  firestoreWriteTimestamp,
  razorpayxPayoutLinksCollection,
  razorpayxPayoutKeyId,
  razorpayxPayoutKeySecret,
  deployOptions,
  razorpayxAccountNumber
} from './global';
import { RazorpayXTransaction } from './models/transactions/razorpayx-transaction';

import { PaypalPayoutTransaction } from './models/transactions/paypal-payout-transaction';
import { onCall } from 'firebase-functions/v2/https';
import { Amount } from '@workern/models';
import { TransactionProcessor } from './models/transactions/transaction-processor';
import { TransactionState } from './enums/transactions/transaction-state';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { UserRecord } from 'firebase-admin/auth';
exports.create = onCall(
  {
    secrets: [
      razorpayxAccountNumber,
      razorpayxPayoutKeyId,
      razorpayxPayoutKeySecret
    ],
    ...deployOptions
  },
  async (request) => {
    const schema = z.object({
      amount: z.object({
        value: z.number().min(1, 'Amount must be greater than 0'),
        currency: z.string().min(3).max(5),
        symbol: z.enum(['$', '₹'])
      }),
      name: z.string(),
      uid: z.literal(request.auth?.uid)
    });
    await checkRequest(request, schema, true);
    const data = request.data as { amount: Amount; name: string; uid: string };
    const uid = request.auth?.uid;

    const transactionDocRef = db
      .collection('users')
      .doc(uid)
      .collection('transactions')
      .doc();

    const transactionId = transactionDocRef.id;
    return db
      .runTransaction(async (t) => {
        const transactionRefByTid =
          transactionsByIdCollection.doc(transactionId);
        const userRef = db.collection('users').doc(uid);
        const snaps = await t.getAll(userRef);
        const user = snaps[0].data() as UserRecord & { balance: number };
        const transaction = getPayoutTransactionObject(
          { amount: data.amount },
          user
        );
        const transactionForAdmin = transaction.forFirestore('admin');
        const transactionForUser = transaction.forFirestore('frontend_user');
        log('transaction for user', transactionForUser);
        log('transaction for admin', transactionForAdmin);
        log('hasEnoughBalance?', user.balance - data.amount.value >= 0);
        if (user.balance - data.amount.value > -0.01) {
          if (transaction.processor.id === TRANSACTION_PROCESSOR_RAZORPAY_X) {
            log('Processor id is', transaction.processor.id);
            try {
              const payoutLink = await createPayoutLink(
                user,
                data,
                transactionId
              );
              if (payoutLink?.id != null) {
                log('payout link created', payoutLink);
                transaction.processor.data.payoutLink = payoutLink;
                t.set(
                  razorpayxPayoutLinksCollection.doc(payoutLink.id),
                  Object.assign({}, payoutLink)
                );

                t.update(userRef, {
                  balance: user.balance - data.amount.value
                });
                t.set(transactionRefByTid, transactionForAdmin);
                t.set(
                  userRef.collection('transactions').doc(transactionId),
                  transactionForUser
                );
                return Promise.resolve({
                  successful: true,
                  message: 'Please visit the link to complete the payout.',

                  ...(transaction.processor.id ===
                    TRANSACTION_PROCESSOR_RAZORPAY_X && {
                    url: transactionForUser.processor.data.payoutLink.url
                  })
                });
              } else {
                throw new HttpsError('internal', 'Failed to Withdraw.');
              }
            } catch (err) {
              error(err);
              throw new HttpsError('internal', 'Failed to Withdraw.');
            }
          } else {
            t.update(userRef, {
              balance: FieldValue.increment(data.amount.value * -1)
            });
            t.set(transactionRefByTid, transactionForAdmin);
            t.set(
              userRef.collection('transactions').doc(transactionId),
              transactionForUser
            );
            return Promise.resolve({
              successful: true,
              message:
                'Your payout request has been placed. You should receive the amount in your PayPal account soon.'
            });
          }
        } else {
          throw new HttpsError(
            'resource-exhausted',
            "You don't have sufficient balance in your account."
          );
        }
      })
      .then((result) => {
        log('transaction write result', result);
        return result;
      })
      .catch((err: Error) => {
        error(err);
        throw err;
      });
  }
);

export function bonusWorker(uid, bonusRef: firestore.DocumentReference) {
  return db.runTransaction((t) => {
    return t.get(db.collection('users').doc(uid)).then((userSnapshot) => {
      const user = userSnapshot.data();
      return t.get(bonusRef).then((bonusSnapshot) => {
        const bonus = bonusSnapshot.data() as any;
        if (!bonus.isSettled) {
          t.update(userSnapshot.ref, { balance: user.balance + bonus.amount });
        }
      });
    });
  });
}

export function getPayoutTransactionObject(
  data: { amount: Amount },
  user: { uid: string; phoneNumber?: string; name?: string }
): RazorpayXTransaction | PaypalPayoutTransaction {
  const transactionId = getAutoId();

  if (user.phoneNumber?.indexOf('+91') > -1) {
    return new RazorpayXTransaction({
      id: transactionId,
      state: TransactionState.PENDING,
      amount: data.amount,
      uid: user.uid,
      message: '',
      processor: {
        id: TRANSACTION_PROCESSOR_RAZORPAY_X,
        data: {}
      }
    });
  } else {
    return new PaypalPayoutTransaction({
      state: TransactionState.PENDING,
      id: transactionId,
      amount: data.amount,
      uid: user.uid,
      message: ''
    });
  }
}

// export function bonusWorkerFromCron(cronSnapshot) {
//   const data = cronSnapshot.val();
//   return bonusWorker(data.workerToBeBonused, db.doc(data.bonusRef)).then(
//     (result) => {
//       return deleteCronBatch(cronSnapshot);
//     }
//   );
// }

// export function handleBonuses(task: Task) {
//   return db.runTransaction((t) => {
//     const requesterRef = db.collection('users').doc(task.owner.uid);
//     const taskRef = requesterRef
//       .collection('mySpaces')
//       .doc(task.spaceId)
//       .collection('tasks')
//       .doc(task.id);
//     return t.get(requesterRef).then((requesterSnap) => {
//       return t.get(taskRef).then((projectSnapshot) => {
//         const requester = requesterSnap.data();
//         const task: Task = new Task(projectSnapshot.data());
//         let totalAmountRequired = 0;
//         for (const key in task.toBeBonused) {
//           totalAmountRequired +=
//             task.toBeBonused[key].amount * DEDUCTION_MULTIPLIER;
//         }
//         if (requester.balance - totalAmountRequired > -0.01) {
//           t.update(requesterRef, {
//             balance: requester.balance - totalAmountRequired
//           });
//           for (const key in task.toBeBonused) {
//             t.set(
//               db
//                 .collection('users')
//                 .doc(key)
//                 .collection('bonusesReceived')
//                 .doc(getAutoId()),
//               {
//                 amount: task.toBeBonused[key].amount,
//                 isSettled: false,
//                 awardedBy: task.owner.uid,
//                 awardedForProject: task.id,
//                 awardedOn: firestoreWriteTimestamp
//               }
//             );
//           }
//           const amountSpentOnBonusTillNow = task.stats.amountSpentOnBonus || 0;
//           const updateMap = {
//             toBeBonused: {},
//             'stats.amountSpentOnBonus':
//               amountSpentOnBonusTillNow + totalAmountRequired,
//             'stats.amountSpent': task.stats.amountSpent + totalAmountRequired
//           };
//           t.update(taskRef, updateMap);
//         }
//       });
//     });
//   });
// }
