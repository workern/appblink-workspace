import 'reflect-metadata';
import * as authFunctions from './auth';
// import * as cronFunctions from './cron-functions';
// import { api as publicApi } from './public-api';
import * as marketingFunctions from './communication/marketing';
import * as paytmFunctions from './billing/gateways/paytm-gateway';
// import * as offeringsManagementFunctions from './offerings-management-app';
// import * as gratificationFunctions from './gratification-app';
// import * as spacesFunctions from './spaces/spaces-app';
// import * as tasksFunctions from './tasks/tasks-app';
// import * as webhookFunctions from './webhook-functions';
// import * as interviewsFunctions from './interviews-app';
import * as razorpayFunctions from './billing/gateways/razorpay';
import { oauth2 as oAuth2App } from './apps/offerings/oauth2';
// import * as automationsFunctions from './automations';
// import * as dataFunctions from './data-functions';
// import * as llmFunctions from './llm-functions';
// import * as checkInAppFunctions from './apps/check-in-app';
import * as whatsAppFunctions from './communication/whatsapp';
import * as nikatfunctions from './apps/nikat';
import * as nikatshopmanagerappfunctions from './apps/nikat-shop-manager';
// import * as promptkulAppFunctions from './apps/promptkul';
// import * as nikatdeliveryfunctions from './apps/nikat-delivery';
import * as saveNestAppFunctions from './apps/save-nest';
import * as dearyoufunctions from './apps/dear-you';
// import * as netWorthCalculatorAppFunctions from './apps/net-worth-calculator';
import * as lemonsqueezyfunctions from './billing/gateways/lemonsqueezy';
import * as revenuecatfunctions from './billing/gateways/revenue-cat';
// import * as attributionfunctions from './attribution';
// import * as promotionsAppFunctions from './apps/promotions-app/campaigns';
// import * as promotionsAppTriggers from './apps/promotions-app/triggers';
// import * as contentCreatorsAppFunctions from './apps/content-creators-app/creators';
// import * as utsavAppFunctions from './apps/utsav';
import * as billingFunctions from './billing';
import * as appblinkFunctions from './apps/app-blink';
import * as workspacesFunctions from './workspaces';

// ─── Billing hook registrations ───────────────────────────────────────────────
// Each app registers its own post-transaction handlers here at cold-start.
// common.ts dispatches to these via the transaction-hooks registry and never
// imports from any individual app folder directly.
import './apps/nikat/billing-hook';
import './apps/dear-you/billing-hook';
import './apps/offerings/billing-hook';
import './automations/leads/billing-hook';

// import * as workpulseTrackerFunctions from './apps/workpulse-tracker';
// import * as deskflowProFunctions from './apps/deskflow-pro';
// // import * as taskwhatsManagerFunctions from './apps/taskwhats-manager';
// import * as turkGuruFunctions from './apps/turk-guru';
// import * as galleryCleanerAppFunctions from './apps/gallery-cleaner';
import * as applicationUsageFunctions from './tracking/applicationusage';
import * as worktimeFunctions from './tracking/worktime';
import * as notificationFunctions from './communication/notifications';
import * as gtmFunctions from './tracking/gtm-functions';

//Common functions
export const auth = authFunctions;
// export const cron = cronFunctions;
// export const api = publicApi;
export const marketing = marketingFunctions;
export const paytm = paytmFunctions;
// export const gratification = gratificationFunctions;
// export const webhook = webhookFunctions;
export const razorpay = razorpayFunctions;
export const lemonsqueezy = lemonsqueezyfunctions;
export const revenuecat = revenuecatfunctions;
export const oauth2 = oAuth2App;
// export const automations = automationsFunctions;
// export const data = dataFunctions;
// export const llm = llmFunctions;
// export const attribution = attributionfunctions;
export const billing = billingFunctions;
export const workspaces = workspacesFunctions;
export const worktime = worktimeFunctions;
export const applicationusage = applicationUsageFunctions;
export const notifications = notificationFunctions;
export const gtm = gtmFunctions;

//App Related functions
export const dearyou = dearyoufunctions;
export const appblink = appblinkFunctions;
export const savenest = saveNestAppFunctions;
export const nsm = nikatshopmanagerappfunctions;
export const nikat = nikatfunctions;
// export const nd = nikatdeliveryfunctions;

// Promotions App
// export const promotionsApp = {
//   ...promotionsAppFunctions,
//   ...promotionsAppTriggers
// };

// Utsav App
// export const utsavApp = utsavAppFunctions;

// export const workpulseTracker = workpulseTrackerFunctions;

// export const deskflowpro = deskflowProFunctions;

// export const taskwhatsManager = taskwhatsManagerFunctions;

// export const turkGuru = turkGuruFunctions;

// export const gallerycleaner = galleryCleanerAppFunctions;

// Content Creators App
// export const contentCreatorsApp = contentCreatorsAppFunctions;

// export const checkInApp = checkInAppFunctions;

export const whatsapp = whatsAppFunctions;

// export const promptkulApp = promptkulAppFunctions;

// export const netWorthCalculatorApp = netWorthCalculatorAppFunctions;
