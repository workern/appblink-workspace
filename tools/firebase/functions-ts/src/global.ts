import * as firebaseFunctions from 'firebase-functions/v1';
import * as firebaseAdmin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { Database } from 'firebase-admin/database';
import { Bucket } from '@google-cloud/storage';
export const projectID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
export const functions = firebaseFunctions;
export const express = require('express');
export const qs = require('querystring');
export const rp = require('request-promise');

export const admin = firebaseAdmin;
//process.env.DEBUG = 'true';
const _firebaseConfig = process.env.FIREBASE_CONFIG
  ? JSON.parse(process.env.FIREBASE_CONFIG)
  : {};
admin.initializeApp({
  databaseURL:
    _firebaseConfig.databaseURL ||
    process.env.DATABASE_URL ||
    `https://${process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT}-default-rtdb.firebaseio.com`
});

const _storageBucket =
  process.env.STORAGE_BUCKET ||
  (process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket
    : undefined);
export const bucket: Bucket = admin.storage().bucket(_storageBucket);
export const db: FirebaseFirestore.Firestore = admin.firestore();
export const firestore = admin.firestore;
db.settings({ ignoreUndefinedProperties: true });
export const transactionsByIdCollection: FirebaseFirestore.CollectionReference =
  db.collection('transactions');
export const razorpayxPayoutLinksCollection: FirebaseFirestore.CollectionReference =
  db.collection('razorpayxPayoutLinks');
export const rtdb: Database = admin.database();
export const firestoreWriteTimestamp: FieldValue =
  FieldValue?.serverTimestamp();
export const firestoreIncrement = FieldValue?.increment;
export const usingEmulator = process.env.FUNCTIONS_EMULATOR;
export const isProduction = !usingEmulator;
export const functionsBaseURL = isProduction
  ? `https://asia-south2-${projectID}.cloudfunctions.net`
  : `http://127.0.0.1:5001/${projectID}/asia-south2`;
export const frontEndURL =
  process.env.FRONTEND_URL || 'http://localhost:4200';
export const cors = require('cors')({
  origin: true
});

export const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
export const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
export const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');
export const cronKey = defineSecret('CRON_KEY');
export const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
export const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
export const AUTOMATION_ENCRYPTION_KEY = defineSecret(
  'AUTOMATION_ENCRYPTION_KEY'
);
export const PAYPAL_CLIENT_ID = defineSecret('PAYPAL_CLIENT_ID');
export const PAYPAL_CLIENT_SECRET = defineSecret('PAYPAL_CLIENT_SECRET');
export const DODO_API_KEY = defineSecret('DODO_API_KEY');
export const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY');
export const LEMON_SQUEEZY_API_KEY = defineSecret('LEMON_SQUEEZY_API_KEY');
export const META_APP_SECRET = defineSecret('META_APP_SECRET');
export const META_APP_ID = defineSecret('META_APP_ID');
export const REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE = defineSecret(
  'REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE'
);
export const REVENUE_CAT_API_KEY = defineSecret('REVENUE_CAT_API_KEY');
export const PINTEREST_ACCESS_TOKEN = defineSecret('PINTEREST_ACCESS_TOKEN');
export const PRODUCTS_MANAGEMENT_KEY = defineSecret('PRODUCTS_MANAGEMENT_KEY');
export const GOOGLE_ADS_DEVELOPER_TOKEN = defineSecret(
  'GOOGLE_ADS_DEVELOPER_TOKEN'
);
export const IP_DATA_API_KEY = defineSecret('IPDATA_API_KEY');
export const HIKER_API_KEY = defineSecret('HIKER_API_KEY');
export const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');
export const defaultSuccessResult = { successful: true };


export const deployOptions = {
  cors: true,
  region: ['asia-south2'],
  memory: '512MiB' as any
};
