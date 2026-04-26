'use strict';

import * as crypto from 'crypto';
import * as util from 'util';

var i;
if (require.main === module) {
  var enc = encrypt('One97');
  console.log('encrypted - ' + enc);
  console.log('decrypted - ' + decrypt(enc));

  for (i = 0; i < 5; i++) {
    gen_salt(4, logsalt);
  }
}

const iv = '@@@@&&&&####$$$$';

export function encrypt(data, custom_key?) {
  var key = custom_key;
  var algo = '256';
  switch (key.length) {
    case 16:
      algo = '128';
      break;
    case 24:
      algo = '192';
      break;
    case 32:
      algo = '256';
      break;
  }
  var cipher = crypto.createCipheriv('AES-' + algo + '-CBC', key, iv);
  //var cipher = crypto.createCipher('aes256',key);
  var encrypted = cipher.update(data, 'binary', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function decrypt(data, custom_key?) {
  var key = custom_key;
  var algo = '256';
  switch (key.length) {
    case 16:
      algo = '128';
      break;
    case 24:
      algo = '192';
      break;
    case 32:
      algo = '256';
      break;
  }
  var decipher = crypto.createDecipheriv('AES-' + algo + '-CBC', key, iv);
  var decrypted = decipher.update(data, 'base64', 'binary');
  try {
    decrypted += decipher.final('binary');
  } catch (e) {
    util.log(util.inspect(e));
  }
  return decrypted;
}

export function gen_salt(length, cb) {
  crypto.randomBytes((length * 3.0) / 4.0, function (err, buf) {
    var salt;
    if (!err) {
      salt = buf.toString('base64');
    }
    //salt=Math.floor(Math.random()*8999)+1000;
    cb(err, salt);
  });
}

/* one way md5 hash with salt */
export function md5sum(salt, data) {
  return crypto
    .createHash('md5')
    .update(salt + data)
    .digest('hex');
}

export function sha256sum(salt, data) {
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

function logsalt(err, salt) {
  if (!err) {
    console.log('salt is ' + salt);
  }
}
