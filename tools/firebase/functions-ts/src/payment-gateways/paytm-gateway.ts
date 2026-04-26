import { log, error } from 'firebase-functions/logger';
import {
  TRANSACTION_STATE_FAILED,
  TRANSACTION_STATE_PENDING,
  TRANSACTION_STATE_SUCCESSFUL
} from '../constants';
import {
  deleteCronBatch,
  PAYTM_STATUS_CHECK_CRON,
  updateCronBatch,
  writeCronBatch
} from '../cron-functions';
import {
  functions,
  isProduction,
  db,
  rp,
  firestoreWriteTimestamp,
  transactionsByIdCollection,
  deployOptions,
  functionsBaseURL
} from '../global';

import * as paytm from '../checksum/checksum';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { Transaction } from '../models/transactions/transaction';

import { TransactionState } from '../enums/transactions/transaction-state';
import { TransactionType } from '../enums/transactions/transaction-type';
import { TransactionReason } from '../enums/transactions/transaction-reason';
import { Amount } from '@workern/models';
import { Timestamp } from 'firebase-admin/firestore';
import { onTransactionSuccessful } from './common';
const paytmMerchantKey = ''; //TODO;
const paytmMID = ''; //TODO;

/**cron not required */

function handlePayTMTransactionStatus(data) {
  return transactionsByIdCollection
    .where('processor.data.ORDERID', '==', data.ORDERID)

    .get()
    .then<any>((transactionSnaps) => {
      if (transactionSnaps.docs.length == 1) {
        const transaction = new Transaction(transactionSnaps.docs[0].data());
        if (transaction.amount.value == parseInt(data.TXNAMOUNT)) {
          const workernTransactionStatus = getWorkernTransactionStatus(
            data.STATUS
          );
          switch (workernTransactionStatus) {
            case TRANSACTION_STATE_SUCCESSFUL:
              return onTransactionSuccessful(transaction, data);
            case TRANSACTION_STATE_FAILED:
            case TRANSACTION_STATE_PENDING:
              return writeTransaction(
                transaction.uid,
                workernTransactionStatus,
                data
              );

            default:
              error('workern transaction status not matched with any status.');
              return Promise.resolve();
          }
        } else {
          error("amount in paytm and amount in firestore don't match");
          return Promise.resolve();
        }
      } else {
        error("Doc doesn't exist in handle Transaction status");
        return Promise.resolve();
      }
    });
}

function getWorkernTransactionStatus(status) {
  switch (status) {
    case 'TXN_SUCCESS':
      return TransactionState.SUCCESSFUL;
    case 'PENDING':
      return TransactionState.PENDING;
    case 'TXN_FAILURE':
      return TransactionState.FAILED;
    default:
      return '';
  }
}

function getTimeForNextGatewayStatusAPICheck(number) {
  if (number <= 10) return 60000;
  switch (number) {
    case 11:
      return 900000;
    case 12:
      return 900000;
    case 13:
      return 1800000;
    case 14:
      return 18000000;
    case 15:
      return 21600000;
    case 16:
      return 43200000;
    case 17:
      return 86400000;
    case 18:
      return 86400000;
    case 19:
      return 86400000;
  }
  return 0;
}

function writeTransaction(uid, transactionState, transactionResponseData) {
  var batch = db.batch();

  batch.update(
    transactionsByIdCollection.doc(transactionResponseData.ORDERID),
    {
      state: transactionState,
      message: transactionResponseData.RESPMSG
    }
  );
  batch.set(
    db
      .collection('users')
      .doc(uid)
      .collection('transactions')
      .doc(transactionResponseData.ORDERID),
    {
      state: transactionState,
      message: transactionResponseData.RESPMSG,
      type: TransactionType.CREDIT,
      reason: TransactionReason.DEPOSIT,
      amount: {
        value: parseFloat(transactionResponseData.TXNAMOUNT),
        currency: 'INR',
        symbol: '₹'
      } as Amount,
      createdAt: Timestamp.now(),
      finalizedAt: Timestamp.now()
    }
  );
  return batch.commit();
}

exports.checkSumGeneration = onCall(deployOptions, (context) => {
  const data = context.data;
  log('PaytmCheckSumGeneration', data);
  data.amount = parseFloat(data.amount);
  const uid = context.auth.uid;
  let callbackUrl;
  if (uid != null) {
    if (data.channelId != null && data.channelId == 'WAP' && !isProduction) {
      callbackUrl = `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${data.orderId}`;
    } else {
      data.channelId = 'WEB';

      callbackUrl = `${functionsBaseURL}/paytm-onTransactionCallbackFlow`;
    }
    data.timestamp = firestoreWriteTimestamp;
    return transactionsByIdCollection
      .doc(data.orderId)
      .set(data)
      .then((value) => {
        var paytmParams: any = {};
        paytmParams['MID'] = paytmMID;
        paytmParams['ORDER_ID'] = data.orderId;
        paytmParams['CHANNEL_ID'] = data.channelId;
        paytmParams['CUST_ID'] = uid;
        if (!isProduction || data.phoneNumber) {
          paytmParams['MOBILE_NO'] = isProduction
            ? data.phoneNumber
            : '7777777777';
        }
        if (!isProduction || data.email) {
          paytmParams['EMAIL'] = isProduction
            ? data.email
            : 'username@emailprovider.com';
        }

        paytmParams['TXN_AMOUNT'] = data.amount + '';
        paytmParams['WEBSITE'] = isProduction ? 'WEBPROD' : 'WEBSTAGING';
        paytmParams['INDUSTRY_TYPE_ID'] = isProduction ? 'Retail109' : 'Retail';
        paytmParams['CALLBACK_URL'] = callbackUrl;

        return new Promise((resolve, reject) => {
          log(paytmParams);
          paytm.genchecksum(
            paytmParams,
            paytmMerchantKey,
            function (un, params) {
              log(params);
              resolve(params);
            }
          );
        }).then((result) => result);
      })
      .catch((err) => {
        error(err);
        return { err };
      });
  } else {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User not authenticated'
    );
  }
});

exports.onTransactionCallbackFlow = onRequest(deployOptions, (req, res) => {
  if (req.method != 'POST') {
    res.status(400).send('Not a post method');
    return Promise.resolve(null);
  }

  const transactionResponse = req.body;
  log('TransactionResponse', transactionResponse);
  if (paytm.verifychecksum(transactionResponse, paytmMerchantKey)) {
    return hitPayTMStatusAPIEndpoint({
      MID: transactionResponse.MID,
      ORDERID: transactionResponse.ORDERID
    })
      .then((status) => {
        if (status == 'PENDING') {
          return writeCronBatch({
            function: PAYTM_STATUS_CHECK_CRON,
            orderDetails: transactionResponse,
            time: new Date().getTime() + getTimeForNextGatewayStatusAPICheck(1),
            nextCount: 1
          }).then((value) => {
            return redirectAfterPayTM(res, TRANSACTION_STATE_PENDING);
          });
        } else if (status == 'TXN_SUCCESS') {
          return redirectAfterPayTM(res, TRANSACTION_STATE_SUCCESSFUL);
        } else if (status == 'TXN_FAILURE') {
          return redirectAfterPayTM(res, TRANSACTION_STATE_FAILED);
        } else res.send('Unknown error occured from paytm');
      })
      .catch((err) => {
        error(err);

        return writeCronBatch({
          function: PAYTM_STATUS_CHECK_CRON,
          orderDetails: transactionResponse,
          time: new Date().getTime() + getTimeForNextGatewayStatusAPICheck(1),
          nextCount: 1
        }).then((value) => {
          return redirectAfterPayTM(res, TRANSACTION_STATE_PENDING);
        });
      });
  } else {
    res.send('transaction not verified');
    return Promise.resolve('transaction not verified');
  }
});

export function hitPayTMStatusAPIEndpointWithCron(cronSnapshot) {
  var data = cronSnapshot.val();
  var orderDetails = data.orderDetails;

  if (orderDetails != null && data.time < Date.now()) {
    orderDetails = { MID: orderDetails.MID, ORDERID: orderDetails.ORDERID };
    return hitPayTMStatusAPIEndpoint(orderDetails)
      .then((status) => {
        if (status == 'TXN_SUCCESS' || status == 'TXN_FAILURE') {
          return deleteCronBatch(cronSnapshot);
        } else if (status == 'PENDING') {
          const data = cronSnapshot.val();
          var nextCount = data.nextCount + 1;

          if (nextCount <= 19) {
            return updateCronBatch(cronSnapshot, {
              nextCount: nextCount,
              time: data.time + getTimeForNextGatewayStatusAPICheck(nextCount)
            });
          } else {
            return deleteCronBatch(cronSnapshot);
          }
        } else {
          error(
            `status:${status} in hitPaytmStatusAPIEndpointwith cron not matched with any required ones.`
          );
          return Promise.resolve();
        }
      })
      .catch((err) => {
        if (err.code == 1) error('status api response not json:', err.response);
        return Promise.resolve('status api not working');
      });
  } else {
    return Promise.resolve();
  }
}

export function hitPayTMStatusAPIEndpoint(orderDetails) {
  return new Promise((resolve, reject) => {
    paytm.genchecksumbystring(
      JSON.stringify(orderDetails),
      paytmMerchantKey,
      function (un, params) {
        var options = {
          method: 'POST',
          uri:
            'https://securegw' +
            (isProduction ? '' : '-stage') +
            '.paytm.in/merchant-status/getTxnStatus',
          body: 'JsonData=' + JSON.stringify(orderDetails),
          headers: {
            'Content-type': 'application/json'
          }
        };
        rp(options)
          .then(function (response) {
            try {
              response = JSON.parse(response);
            } catch (e) {}
            if (response.constructor === {}.constructor) {
              return handlePayTMTransactionStatus(response)
                .then((value) => resolve(response.STATUS))
                .catch((error) => reject(error));
            } else {
              return reject({ code: 1, response: response });
            }
          })
          .catch(function (err) {
            error(`problem with request: ${err.message}`);
            return reject();
          });
      }
    );
  });
}

export function redirectAfterPayTM(res, code) {
  res.redirect(
    (isProduction
      ? 'https://offerings.workern.com/profile'
      : 'http://localhost:4200/profile') +
      '?status=' +
      code
  );
}
