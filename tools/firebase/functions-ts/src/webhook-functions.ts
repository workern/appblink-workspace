import { log } from 'firebase-functions/logger';
import { db, defaultSuccessResult, deployOptions } from './global';
import { sendMail, handlePayoutLinkStatus, handlePayoutStatus } from './utils';
import { onRequest } from 'firebase-functions/v2/https';

exports.onRazorpayxEvent = onRequest(deployOptions, (req, res) => {
  const body = req.body;

  if (body.contains?.indexOf('payout') > -1) {
    const payout = body.payload.payout.entity;
    switch (payout.status) {
      case 'processed':
      case 'reversed':
      case 'updated':
        return handlePayoutStatus(payout).then((result) => {
          return db
            .collection('razorpayPayouts')
            .doc(payout.id)
            .set(payout)
            .then((Void) => {
              res.send(defaultSuccessResult);
            });
        });
      case 'queued':
        return sendMail(
          'watwanik06@gmail.com',
          '[URGENT] Fund Razorpayx balance',
          'Your razorpayx balance is less than what is need it. Fund it soon'
        ).then((result) => {
          res.send(defaultSuccessResult);
        });
      default:
        log(`${payout.status} is not the event we are listening for.`);
        res.send(defaultSuccessResult);
    }
  } else if (body.contains?.indexOf('payout_link') > -1) {
    log('Payout link event received: ', body.payload.payout_link.entity);
    const payoutLink = body.payload.payout_link.entity;
    return handlePayoutLinkStatus(payoutLink)
      .then((result) => {
        log('Payout link status handled. Status after handling: ', result);
        res.send(defaultSuccessResult);
      })
      .catch((error) => {
        log('Error in handling payout link status: ', error);
        res.status(500).send('Error in handling payout link status');
      });
  }
});
