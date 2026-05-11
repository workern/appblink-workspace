import 'reflect-metadata';
import * as authFunctions from './auth';
import * as cronFunctions from './cron-functions';
import { api as publicApi } from './public-api';
import * as databaseFunctions from './database-change-functions';
import * as marketingFunctions from './marketing';
import * as paytmFunctions from './billing/gateways/paytm-gateway';
import * as offeringsManagementFunctions from './offerings-management-app';
import * as gratificationFunctions from './gratification-app';
import * as spacesFunctions from './spaces/spaces-app';
import * as tasksFunctions from './tasks/tasks-app';
import * as webhookFunctions from './webhook-functions';
import * as interviewsFunctions from './interviews-app';
import * as razorpayFunctions from './billing/gateways/razorpay';
import { oauth2 as oAuth2App } from './oauth2';
import * as automationsFunctions from './automations';
import * as dataFunctions from './data-functions';
import * as llmFunctions from './llm-functions';
import * as checkInAppFunctions from './apps/check-in-app';
import * as whatsAppFunctions from './communication/whatsapp';
import * as nikatFunctions from './apps/nikat';
import * as nikatShopManagerAppFunctions from './apps/nikat-shop-manager';
import * as promptkulAppFunctions from './apps/promptkul';
import * as nikatDeliveryAppFunctions from './apps/nikat-delivery';
import * as saveNestAppFunctions from './apps/save-nest';
import * as eGiftsAppFunctions from './apps/egifts-app';
import * as netWorthCalculatorAppFunctions from './apps/net-worth-calculator';
import * as lemonSqueezyFunctions from './billing/gateways/lemonsqueezy';
import * as revenueCatFunctions from './billing/gateways/revenue-cat';
import * as attributionFunctions from './attribution';
import * as promotionsAppFunctions from './apps/promotions-app/campaigns';
import * as promotionsAppTriggers from './apps/promotions-app/triggers';
import * as contentCreatorsAppFunctions from './apps/content-creators-app/creators';
import * as utsavAppFunctions from './apps/utsav';
import * as billingFunctions from './billing';
import * as appblinkFunctions from './apps/app-blink';
import * as workspacesFunctions from './workspaces';

import * as workpulseTrackerFunctions from './apps/workpulse-tracker';
import * as deskflowProFunctions from './apps/deskflow-pro';
import * as taskwhatsManagerFunctions from './apps/taskwhats-manager';
import * as turkGuruFunctions from './apps/turk-guru';
import * as galleryCleanerAppFunctions from './apps/gallery-cleaner';
import * as applicationUsageFunctions from './applicationusage';
import * as worktimeFunctions from './worktime';

// Gallery Cleaner functions
export const galleryCleanerApp = galleryCleanerAppFunctions;
export const savenest = saveNestAppFunctions;

// Auth functions
export const auth = authFunctions;

// Cron functions
export const cron = cronFunctions;

// Public API
export const api = publicApi;

// Database functions
export const database = databaseFunctions;

// Marketing functions
export const marketing = marketingFunctions;

// Paytm gateway functions
export const paytm = paytmFunctions;

// Offerings management functions
export const offerings = offeringsManagementFunctions;

// Gratification functions
export const gratification = gratificationFunctions;

// Spaces functions
export const spaces = spacesFunctions;

// Tasks functions
export const tasks = tasksFunctions;

// Webhook
export const webhook = webhookFunctions;

// Qualifications functions
export const interviews = interviewsFunctions;

// Razorpay payment gateway functions
export const razorpay = razorpayFunctions;

export const lemonSqueezy = lemonSqueezyFunctions;

// RevenueCat webhook (App Store + Play Store subscription lifecycle)
export const revenueCat = revenueCatFunctions;

// OAuth2 functions
export const oauth2 = oAuth2App;

// Automations functions
export const automations = automationsFunctions;

// Data functions
export const data = dataFunctions;

// LLM functions
export const llm = llmFunctions;

//QR Check-in app functions

// Attribution system
export const attribution = attributionFunctions;

// Generic billing app
export const billing = billingFunctions;

export const workspaces = workspacesFunctions;

// Global work-time tracking (VS Code extensions, mobile apps, web)
export const worktime = worktimeFunctions;

export const applicationusage = applicationUsageFunctions;

// Promotions App
export const promotionsApp = {
  ...promotionsAppFunctions,
  ...promotionsAppTriggers
};

export const appblink = appblinkFunctions;

// Utsav App
export const utsavApp = utsavAppFunctions;

export const workpulseTracker = workpulseTrackerFunctions;

export const deskflowpro = deskflowProFunctions;

export const taskwhatsManager = taskwhatsManagerFunctions;

export const turkGuru = turkGuruFunctions;

export const gallerycleaner = galleryCleanerAppFunctions;

// Content Creators App
export const contentCreatorsApp = contentCreatorsAppFunctions;

export const checkInApp = checkInAppFunctions;

export const whatsapp = whatsAppFunctions;

export const nikat = nikatFunctions;

export const nsm = nikatShopManagerAppFunctions;

export const nikatDeliveryApp = nikatDeliveryAppFunctions;

export const promptkulApp = promptkulAppFunctions;

export const eGiftsApp = eGiftsAppFunctions;

export const netWorthCalculatorApp = netWorthCalculatorAppFunctions;
