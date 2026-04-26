import { error } from 'firebase-functions/logger';

const nodemailer = require('nodemailer');

export const smtpTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: 'admin@workern.com',
    // serviceClient: serviceAccount.client_id,
    // privateKey: serviceAccount.private_key
  },
});

export function sendMail(to, subject, message) {
  return new Promise((resolve, reject) => {
    var mailOptions = {
      from: 'Workern admin<admin@workern.com>',
      to: to,
      subject: subject,
      html: message,
    };

    smtpTransport.sendMail(mailOptions, function (err, response) {
      if (err) {
        error(err);
        return reject(err);
      } else {
        return resolve(response.message);
      }
    });
  });
}
