import { defineSecret } from 'firebase-functions/params';

export const whatsappAccessToken = defineSecret('WHATSAPP_ACCESS_TOKEN');
export const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v25.0';

export const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
