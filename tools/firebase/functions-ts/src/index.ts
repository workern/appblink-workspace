import 'reflect-metadata';
import * as authFunctions from './auth';
import * as marketingFunctions from './marketing';
import * as paytmFunctions from './payment-gateways/paytm-gateway';
import * as gratificationFunctions from './gratification-app';
import * as spacesFunctions from './spaces/spaces-app';
import * as webhookFunctions from './webhook-functions';
import * as razorpayFunctions from './payment-gateways/razorpay';
import { oauth2 as oAuth2App } from './oauth2';
import * as dataFunctions from './data-functions';
import * as lemonSqueezyFunctions from './payment-gateways/lemonsqueezy';
import * as revenueCatFunctions from './payment-gateways/revenue-cat';
import * as attributionFunctions from './attribution';

import * as billingFunctions from './billing';
import * as teamsFunctions from './teams';



// Auth functions
export const auth = authFunctions;


// Marketing functions
export const marketing = marketingFunctions;



// Spaces functions
export const spaces = spacesFunctions;


// Webhook
export const webhook = webhookFunctions;

// Gratification functions
export const gratification = gratificationFunctions;

// Paytm gateway functions
export const paytm = paytmFunctions;


// Razorpay payment gateway functions
export const razorpay = razorpayFunctions;

export const lemonSqueezy = lemonSqueezyFunctions;

// RevenueCat webhook (App Store + Play Store subscription lifecycle)
export const revenueCat = revenueCatFunctions;

// OAuth2 functions
export const oauth2 = oAuth2App;


// Data functions
export const data = dataFunctions;


// Attribution system
export const attribution = attributionFunctions;


// Generic billing app
export const billing = billingFunctions;


// Generic teams management (invite/remove/list members for any workspace-enabled app)
export const teams = teamsFunctions;

