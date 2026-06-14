import { log } from 'firebase-functions/logger';
import { db, qs, rp, deployOptions, cronKey, SENDGRID_API_KEY } from '../global';
import * as nodemailer from 'nodemailer';

const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const secureCompare = require('secure-compare');
const Handlebars = require('handlebars');

import { SendMailClient } from 'zeptomail';
import { inviteToSpaceTemplate } from '../constants/mail_templates';
import { onRequest } from 'firebase-functions/v2/https';
const smtpTransport = nodemailer.createTransport({
  host: 'smtp.zoho.com', // Your SMTP server address

  secure: true, // true for 465, false for other ports like 587
  auth: {
    user: 'admin@workern.com',
    pass: 'ASdf@100'
  }
});

exports.getSendGridContactList = onRequest(
  { ...deployOptions, secrets: [SENDGRID_API_KEY] },
  function (req, res) {
    var request: any = {};
    sgClient.setApiKey(SENDGRID_API_KEY.value());
    request.method = 'GET';
    request.url = '/v3/contactdb/lists';
    sgClient.request(request).then(([response, body]) => {
      var getSendersRequest: any = {};
      getSendersRequest.method = 'GET';
      getSendersRequest.url = '/v3/senders';
      return sgClient
        .request(getSendersRequest)
        .then(([response, body]) => {
          const data = {
            custom_unsubscribe_url: '',
            html_content:
              '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html data-editor-version="2" class="sg-projects" xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" /><!--[if !mso]><!--> <meta http-equiv="X-UA-Compatible" content="IE=Edge" /><!--<![endif]--> <!--[if (gte mso 9)|(IE)]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--> <!--[if (gte mso 9)|(IE)]> <style type="text/css"> body {width: 600px;margin: 0 auto;} table {border-collapse: collapse;} table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;} img {-ms-interpolation-mode: bicubic;} </style> <![endif]--> <style type="text/css"> body, p, div { font-family: arial; font-size: 14px; } body { color: #000000; } body a { color: #1188E6; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width:100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 480px !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } } </style> <!--user entered Head Start--> <!--End Head user entered--> </head> <body> <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size: 14px; font-family: arial; color: #000000; background-color: #ffffff;"> <div class="webkit"> <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#ffffff"> <tr> <td valign="top" bgcolor="#ffffff" width="100%"> <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0"> <tr> <td width="100%"> <table width="100%" cellpadding="0" cellspacing="0" border="0"> <tr> <td> <!--[if mso]> <center> <table><tr><td width="600"> <![endif]--> <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width:600px;" align="center"> <tr> <td role="modules-container" style="padding: 0px 0px 0px 0px; color: #000000; text-align: left;" bgcolor="#ffffff" width="100%" align="left"> <table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;"> <tr> <td role="module-content"> <p></p> </td> </tr> </table> <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;"> <tr> <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit;" height="100%" valign="top" bgcolor=""> <div>Hello&nbsp;<span style="font-family: Colfax, Helvetica, Arial, sans-serif; font-size: 16px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; white-space: pre;">[%displayName | Default Value%], A new task worth Rs. has been added on Workern. </span></div><div><font face="Colfax, Helvetica, Arial, sans-serif"><span style="font-size: 16px; white-space: pre;">Click below to complete the task</span></font></div><div>&nbsp;</div> </td> </tr> </table> <table border="0" cellPadding="0" cellSpacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed" width="100%"><tbody><tr><td align="center" bgcolor="" class="outer-td" style="padding:0px 0px 0px 0px"><table border="0" cellPadding="0" cellSpacing="0" class="button-css__deep-table___2OZyb wrapper-mobile" style="text-align:center"><tbody><tr><td align="center" bgcolor="#333333" class="inner-td" style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"><a href="www.workern.com/tasks/work?projectId=' +
              'dz1g8mGsGFHRq9NXgYPi' +
              '"style="background-color:#333333;border:1px solid #333333;border-color:#333333;border-radius:6px;border-width:1px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0px;line-height:16px;padding:12px 18px 12px 18px;text-align:center;text-decoration:none" target="_blank">View Task</a></td></tr></tbody></table></td></tr></tbody></table><div data-role="module-unsubscribe" class="module unsubscribe-css__unsubscribe___2CDlR" role="module" data-type="unsubscribe" style="color:#444444;font-size:12px;line-height:20px;padding:16px 16px 16px 16px;text-align:center"><div class="Unsubscribe--addressLine"><p class="Unsubscribe--senderName" style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px">[Sender_Name]</p><p style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px"><span class="Unsubscribe--senderAddress">[Sender_Address]</span>, <span class="Unsubscribe--senderCity">[Sender_City]</span>, <span class="Unsubscribe--senderState">[Sender_State]</span> <span class="Unsubscribe--senderZip">[Sender_Zip]</span> </p></div><p style="font-family:Arial,Helvetica, sans-serif;font-size:12px;line-height:20px"><a class="Unsubscribe--unsubscribeLink" href="<%asm_group_unsubscribe_raw_url%>">Unsubscribe</a> - <a class="Unsubscribe--unsubscribePreferences" href="<%asm_preferences_raw_url%>">Unsubscribe Preferences</a></p></div> </td> </tr> </table> <!--[if mso]> </td></tr></table> </center> <![endif]--> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div> </center> </body></html>',
            list_ids: [4926536],
            sender_id: body[0].id,
            suppression_group_id: 7445,
            subject: 'Workern: Rs. ' + 10 + ' task available',
            title: 'hello'
          };
          var createProjectRequest: any = {};
          createProjectRequest.body = data;
          createProjectRequest.method = 'POST';

          createProjectRequest.url = '/v3/projects';

          return sgClient
            .request(createProjectRequest)
            .then(([response, body]) => {
              var sendProject: any = {};
              const data = '';
              sendProject.body = data;
              sendProject.method = 'POST';

              sendProject.url = '/v3/projects/' + body.id + '/schedules/now';

              return sgClient.request(sendProject).then(([response, body]) => {
                res.send(body);
              });
            });
        })
        .catch((error) => {
          res.status(400);
          res.send(error);
        });
    });
  }
);

function addUserToSendGridContactList(userName, userRecord) {
  const data = [
    {
      displayName: userName,
      email: userRecord.email,
      photoUrl: userRecord.photoURL,
      uid: userRecord.uid
    }
  ];
  var request: any = {};
  request.body = data;
  request.method = 'POST';
  request.url = '/v3/contactdb/recipients';
  return sgClient.request(request).then(([response, body]) => {
    const data = '';
    var request2: any = {};
    request2.body = data;
    request2.method = 'POST';
    request2.url =
      '/v3/contactdb/lists/4923461/recipients/' + body.persisted_recipients[0];
    return sgClient.request(request2).then(([response, body]) => {
      return Promise.resolve();
    });
  });
}

function sendMail(to, subject, message) {
  return new Promise((resolve, reject) => {
    var mailOptions = {
      from: 'Workern Admin<admin@workern.com>',
      to: to,
      subject: subject,
      html: message
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        return reject(error);
      } else {
        return resolve(response.message);
      }
    });
  });
}

export function sendMailUsingSendGrid(
  to: string,
  templateId: string,
  dynamicTemplateData: any
) {
  sgMail.setApiKey(SENDGRID_API_KEY.value());
  const msg = {
    to: to, // recipient's email
    from: 'admin@workern.com', // sender's email (must be verified with SendGrid)
    templateId: templateId, // your dynamic template ID
    dynamic_template_data: dynamicTemplateData
  };
  log('Sending mail', to, templateId, dynamicTemplateData);
  return sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully!');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
}

export function sendMailUsingZeptoMail(
  emails: string[],
  templateKey: string,
  dynamicData: any
) {
  const url = 'api.zeptomail.com/';
  const token = '<SEND_MAIL_TOKEN>';

  let client = new SendMailClient({ url, token });
  client
    .sendMail({
      from: {
        address: 'admin@workern.com',
        name: 'noreply'
      },
      to: emails.map((email) => {
        return { email_address: email };
      }),
      template_key: templateKey,
      merge_info: dynamicData
    })
    .then((resp) => console.log('success'))
    .catch((error) => console.log('error'));
}

export function sendInvitationMail(to: string, dynamicData: any) {
  const template = inviteToSpaceTemplate;
  const subject = Handlebars.compile(template.subject)(dynamicData);
  const body = Handlebars.compile(template.body)(dynamicData);
  return sendMail(to, subject, body);
}

exports.sendMailForBalance = onRequest(
  { ...deployOptions, secrets: [cronKey] },
  (req, res) => {
    const key = req.query.key;

    // Exit if the keys don't match.

    if (!secureCompare(key, cronKey.value())) {
      console.error(
        'The key provided in the request does not match the key set in the environment. Check that',
        key,
        'matches the cron.key attribute in `firebase env:get`'
      );
      res
        .status(403)
        .send(
          'Security key does not match. Make sure your "key" URL query parameter matches the ' +
            'cron.key environment variable.'
        );
      return null;
    }
    return db
      .collection('users')
      .where('balance', '>=', 1)
      .orderBy('balance', 'desc')
      .get()
      .then((querySnap) => {
        var promises = [];

        querySnap.forEach((userSnap) => {
          const data = userSnap.data();
          if (data.email) {
            const msg = {
              to: data.email,
              from: 'admin@workern.com',
              subject: 'Withdraw Workern balance to PayTM',
              html:
                '<div>Hi ' +
                (data.displayName != null ? data.displayName : '') +
                ',</div><div>Your Workern account balance is Rs.' +
                (data.balance / 100).toFixed(2) +
                '. You can withdraw it to your PayTM account balance by visiting <a href="https://www.workern.com/profile">this link</a>.</div><p>With Regards, <br/>Kartik Watwani(Admin)</p>'
            };
            promises.push(sendMail(data.email, msg.subject, msg.html));
          }
        });
        return Promise.all(promises)
          .then((result) => {
            res.send('done');
          })
          .catch((error) => {
            res.send(error);
          });
      });
  }
);

function sendTextMessages(numbers, message) {
  let body = qs.stringify({
    apikey: '', //TODO: Add textlocal api key
    numbers: numbers.join(),
    message: message
  });
  let options = {
    method: 'POST',
    uri: 'https://api.textlocal.in/send/',
    body: body,
    json: true,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
      'cache-control': 'no-cache'
    }
  };

  return rp(options)
    .then(function (response) {
      return Promise.resolve(response);
    })
    .catch(function (error) {
      console.error(`problem with request: ${error.message}`);
      return Promise.reject(error);
    });
}
