import { AccountType } from 'ct-razorpayx/lib/src/resources/fund-account';
import {
  Payout,
  PayoutPurposetype,
} from 'ct-razorpayx/lib/src/resources/payout';
import { error, log } from 'firebase-functions/logger';
import {
  TRANSACTION_STATE_FAILED,
  TRANSACTION_STATE_PENDING,
  TRANSACTION_STATE_SUCCESSFUL,
  WITHDRAWLMULTIPLIER,
} from './constants';
import {
  db,
  transactionsByIdCollection,
  razorpayxAccountNumber,
  razorpayxPayoutKeyId,
  razorpayxPayoutKeySecret,
  razorpayxPayoutLinksCollection,
  isProduction,
} from './global';
import {
  PayoutLink,
  PayoutLinkStatus,
} from 'ct-razorpayx/lib/src/resources/payout-link';
import Razorpayx from 'ct-razorpayx';

export function getRazorpayxClient() {
  return new Razorpayx({
    key_id: isProduction ? razorpayxPayoutKeyId.value() : '',
    key_secret: isProduction ? razorpayxPayoutKeySecret.value() : '',
  });
}
export function createRazorpayxContact(
  uid: string,
  name: string,
  email?: string,
  phoneNumber?: string
) {
  return getRazorpayxClient()
    .contacts.create({
      name: name.toLowerCase(),
      type: 'worker',
      reference_id: uid,
      ...(email && { email: email.toLowerCase() }),
      ...(phoneNumber && { contact: phoneNumber.toLowerCase() }),
    })
    .then((result) => {
      const batch = db.batch();
      batch.set(db.collection('razorpayxContacts').doc(result.id), result);
      batch.set(db.collection('usersForAdmin').doc(uid), {
        razorpayxContactId: result.id,
      });
      return batch.commit().then((Void) => Promise.resolve(result));
    })
    .catch((err) => {
      error(err);
      return Promise.reject(err.message);
    });
}

export function updateRazorpayxContact(
  razorpayContactId: string,
  name: string,
  email?: string,
  phoneNumber?: string
) {
  return getRazorpayxClient()
    .contacts.update(razorpayContactId, {
      name: name,
      ...(email && { email: email }),
      ...(phoneNumber && { contact: phoneNumber }),
    })
    .then((result) => {
      return db.collection('razorpayxContacts').doc(result.id).set(result);
    })
    .catch((err) => {
      error(err);
      return Promise.reject(err.message);
    });
}

export function createRazorpayxFundAccount(
  razorpayContactId,
  bankDetails: { name: string; accountNumber: string; ifsc: string },
  uid: string
) {
  const bankAccount = {
    name: bankDetails.name,
    account_number: bankDetails.accountNumber,
    ifsc: bankDetails.ifsc,
  };

  delete bankDetails.accountNumber;
  return getRazorpayxClient()
    .fundAccount.create({
      bank_account: bankAccount,
      contact_id: razorpayContactId,
      account_type: AccountType.bankAccount,
    })
    .then((result) => {
      const batch = db.batch();
      batch.set(
        db.collection('usersForAdmin').doc(uid),
        { razorpayxFundAccountId: result.id },
        { merge: true }
      );
      batch.set(db.collection('razorpayxFundAccounts').doc(result.id), result);
      return batch.commit().then((Void) => Promise.resolve(result));
    });
}

export function createPayout(
  fundAccountId: string,
  amount: number,
  orderId: string,
  uid: string
) {
  return getRazorpayxClient()
    .payout.create({
      account_number: razorpayxAccountNumber.value(),
      fund_account_id: fundAccountId,
      currency: 'INR',
      mode: 'IMPS',
      amount: Math.floor(amount * 100),
      purpose: PayoutPurposetype.payout,
      reference_id: orderId,
      notes: {
        uid: uid,
        orderId: orderId,
      },
    })
    .then((result) => {
      return db
        .collection('razorpayPayouts')
        .doc(result.id)
        .set(result)
        .then((Void) => Promise.resolve(result));
    });
}

export function handlePayoutStatus(payout: any) {
  const notes = payout.notes;
  const orderId = notes.orderId;
  const balanceDeducted = notes.balanceDeducted;
  const uid = notes.uid;
  const ordersByTidRef = transactionsByIdCollection.doc(orderId);
  const usersRef = db.collection('users').doc(uid);
  const transactionRefInUser = usersRef.collection('transactions').doc(orderId);
  switch (payout.status) {
    case 'processed':
      const batch = db.batch();
      batch.update(ordersByTidRef, { state: TRANSACTION_STATE_SUCCESSFUL });
      batch.update(transactionRefInUser, {
        state: TRANSACTION_STATE_SUCCESSFUL,
        message: 'Successful transaction',
      });
      return batch
        .commit()
        .then((result) => {
          return Promise.resolve(TRANSACTION_STATE_SUCCESSFUL);
        })
        .catch((error) => Promise.resolve(TRANSACTION_STATE_SUCCESSFUL));

    case 'reversed':
      return db.runTransaction((t) => {
        return t.get(usersRef).then((userDoc) => {
          t.update(usersRef, {
            balance:
              userDoc.data().balance +
              (typeof balanceDeducted == 'string'
                ? parseFloat(balanceDeducted)
                : balanceDeducted),
          });
          t.update(transactionRefInUser, {
            state: TRANSACTION_STATE_FAILED,
            message: payout.failure_reason,
          });
          t.update(ordersByTidRef, {
            state: TRANSACTION_STATE_FAILED,
            message: payout.failure_reason,
          });
          t.update(
            db.collection('razorpayxPayouts').doc(payout.id),
            Object.assign({}, payout)
          );
          return Promise.resolve(TRANSACTION_STATE_FAILED);
        });
      });

    default:
      return (
        db.collection('razorpayxPayouts').doc(payout.id),
        Object.assign({}, payout).then((Void) =>
          Promise.resolve(TRANSACTION_STATE_PENDING)
        )
      );
  }
}

export function handlePayoutLinkStatus(payoutLink: any) {
  const notes = payoutLink.notes;
  const orderId = notes.orderId;
  const balanceDeducted = notes.balanceDeducted;
  const uid = notes.uid;
  const ordersByTidRef = transactionsByIdCollection.doc(orderId);
  const usersRef = db.collection('users').doc(uid);
  const transactionRefInUser = usersRef.collection('transactions').doc(orderId);
  log('Payoutlink status', payoutLink.status);
  switch (payoutLink.status) {
    case PayoutLinkStatus.processed:
      const batch = db.batch();
      batch.update(ordersByTidRef, { state: TRANSACTION_STATE_SUCCESSFUL });
      batch.update(transactionRefInUser, {
        state: TRANSACTION_STATE_SUCCESSFUL,
        message: 'Successful transaction',
      });
      batch.update(
        razorpayxPayoutLinksCollection.doc(payoutLink.id),
        payoutLink
      );
      return batch
        .commit()
        .then((result) => {
          return Promise.resolve(TRANSACTION_STATE_SUCCESSFUL);
        })
        .catch((error) => Promise.resolve(TRANSACTION_STATE_SUCCESSFUL));

    case 'rejected':
    case 'expired':
    case PayoutLinkStatus.cancelled:
      return db.runTransaction((t) => {
        return t.get(usersRef).then((userDoc) => {
          t.update(usersRef, {
            balance:
              userDoc.data().balance +
              (typeof balanceDeducted == 'string'
                ? parseFloat(balanceDeducted)
                : balanceDeducted),
          });
          t.update(transactionRefInUser, {
            state: TRANSACTION_STATE_FAILED,
            message: payoutLink.failure_reason,
          });
          t.update(ordersByTidRef, {
            state: TRANSACTION_STATE_FAILED,
            message: payoutLink.failure_reason,
          });
          t.update(
            razorpayxPayoutLinksCollection.doc(payoutLink.id),
            payoutLink
          );
          return Promise.resolve(TRANSACTION_STATE_FAILED);
        });
      });
    default:
      return razorpayxPayoutLinksCollection
        .doc(payoutLink.id)
        .set(payoutLink)
        .then((Void) => Promise.resolve(TRANSACTION_STATE_PENDING));
  }
}

export function createPayoutLink(user, data: any, orderId: string) {
  log('Creating payout link');
  log(
    process.env.RAZORPAYX_ACCOUNT_NUMBER,
    razorpayxAccountNumber.value(),
    user,
    data,
    orderId
  );
  const amountToWithdraw = data.amount * WITHDRAWLMULTIPLIER;
  return getRazorpayxClient()
    .payoutLink.create({
      account_number: isProduction ? razorpayxAccountNumber.value() : '',
      contact: {
        name: user.name,
        contact: user.phoneNumber,
        type: 'worker',
      },
      amount: Math.round(amountToWithdraw),
      currency: 'INR',
      description: `Withdrawl from workern balance of Rs. ${(Math.round(amountToWithdraw) / 100).toFixed(2)}.`,
      purpose: PayoutPurposetype.payout,
      receipt: orderId,
      send_sms: true,
      notes: {
        uid: user.uid,
        orderId: orderId,
        balanceDeducted: data.amount,
      },
    })
    .then((result) => {
      return razorpayxPayoutLinksCollection
        .doc(result.id)
        .set(result)
        .then((Void) => Promise.resolve(result));
    })
    .catch((err) => {
      error(err.message);
      return Promise.resolve(null);
    });
}
