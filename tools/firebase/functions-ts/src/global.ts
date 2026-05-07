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
admin.initializeApp();

export const bucket: Bucket = admin.storage().bucket();
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
export const frontEndURL = isProduction
  ? 'https://offerings.workern.com'
  : 'http://localhost:4200';
export const cors = require('cors')({
  origin: true
});

export const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID');
export const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET');
export const razorpayWebhookSecret = defineSecret('RAZORPAY_WEBHOOK_SECRET');
export const razorpayxPayoutKeyId = defineSecret('RAZORPAYX_KEY_ID');
export const razorpayxPayoutKeySecret = defineSecret('RAZORPAYX_KEY_SECRET');
export const cronKey = defineSecret('CRON_KEY');
export const razorpayxAccountNumber = defineSecret('RAZORPAYX_ACCOUNT_NUMBER');
export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
export const sheetsApiKey = defineSecret('SHEETS_API_KEY');
export const openaiApiKey = defineSecret('OPENAI_API_KEY');
export const unsplashAccessKey = defineSecret('UNSPLASH_ACCESS_KEY');
export const unsplashSecretKey = defineSecret('UNSPLASH_SECRET_KEY');
export const automationEncryptionKey = defineSecret(
  'AUTOMATION_ENCRYPTION_KEY'
);
export const chargeBeeApiKey = defineSecret('CHARGEBEE_API_KEY');
export const paypalClientId = defineSecret('PAYPAL_CLIENT_ID');
export const paypalClientSecret = defineSecret('PAYPAL_CLIENT_SECRET');
export const dodoApiKey = defineSecret('DODO_API_KEY');
export const stripeApiKey = defineSecret('STRIPE_API_KEY');
export const taskIdGeneratationKey = defineSecret('TASK_ID_GENERATION_KEY');
export const ACR_ACCESS_KEY = defineSecret('ACR_ACCESS_KEY');
export const ACR_ACCESS_SECRET = defineSecret('ACR_ACCESS_SECRET');
export const ACR_ACCESS_TOKEN = defineSecret('ACR_ACCESS_TOKEN');
export const lemonSqueezyApiKey = defineSecret('LEMON_SQUEEZY_API_KEY');
export const revenueCatWebhookAuthorizationHeaderValue = defineSecret(
  'REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE'
);
export const REVENUE_CAT_API_KEY = defineSecret('REVENUE_CAT_API_KEY');
export const pinterestAccessToken = defineSecret('PINTEREST_ACCESS_TOKEN');
export const RAPID_API_KEY = defineSecret('RAPID_API_KEY');
export const PRODUCTS_MANAGEMENT_KEY = defineSecret('PRODUCTS_MANAGEMENT_KEY');
export const defaultSuccessResult = { successful: true };

export const deployOptions = {
  serviceAccount: '524580981259-compute@developer.gserviceaccount.com',
  cors: true,
  region: ['asia-south2'],
  memory: '512MiB' as any
};
