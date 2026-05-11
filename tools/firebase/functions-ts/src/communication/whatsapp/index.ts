import * as messagesFunctions from './messages';
import * as templatesFunctions from './templates';
import * as webhookFunctions from './webhook';
import * as onboardingFunctions from './onboarding';

export const messages = messagesFunctions;
export const templates = templatesFunctions;
export const webhook = webhookFunctions;

// Flat exports so callable names are whatsapp-connectbusiness, whatsapp-disconnectbusiness, whatsapp-sendmessage
export const { connectbusiness, disconnectbusiness, sendmessage } = onboardingFunctions;
