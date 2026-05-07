import 'reflect-metadata';
import * as authFunctions from './auth';
import * as marketingFunctions from './marketing';
import * as paytmFunctions from './billing/gateways/paytm-gateway';
import * as gratificationFunctions from './gratification-app';
import * as webhookFunctions from './webhook-functions';
import * as razorpayFunctions from './billing/gateways/razorpay';
import { oauth2 as oAuth2App } from './oauth2';
import * as dataFunctions from './data-functions';
import * as lemonSqueezyFunctions from './billing/gateways/lemonsqueezy';
import * as revenueCatFunctions from './billing/gateways/revenue-cat';
import * as attributionFunctions from './attribution';
import * as billingFunctions from './billing';
import * as workspacesFunctions from './workspaces';
import * as applicationUsageFunctions from './applicationusage';
import * as worktimeFunctions from './worktime';



// Auth functions
export const auth = authFunctions;



// Marketing functions
export const marketing = marketingFunctions;

// Paytm gateway functions
export const paytm = paytmFunctions;


// Gratification functions
export const gratification = gratificationFunctions;


// Webhook
export const webhook = webhookFunctions;


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

export const workspaces = workspacesFunctions;

// Global work-time tracking (VS Code extensions, mobile apps, web)
export const worktime = worktimeFunctions;

export const applicationusage = applicationUsageFunctions;





