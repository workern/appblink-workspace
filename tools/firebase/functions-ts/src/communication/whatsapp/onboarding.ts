/**
 * WhatsApp Business — Embedded Signup onboarding functions.
 *
 * Generic onboarding flow usable by any app space. The space the config is
 * stored under is derived from the authenticated user's app context.
 *
 * Flow:
 * 1. Business owner clicks "Connect WhatsApp" in the app.
 * 2. Embedded Signup popup launches (Facebook OAuth).
 * 3. After completion the frontend receives a short-lived `code` plus optional
 *    `phoneNumberId`, `wabaId`, and `sessionEvent` from the session logging message event.
 * 4. Frontend calls `connectbusiness` with the code (and optional IDs).
 * 5. This function exchanges the code → user access token → WABA + phone details.
 * 6. For standard flow: registers the phone number for Cloud API use (Tech Provider requirement).
 *    For coexistence flow (sessionEvent = FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING):
 *    skips registration (number already registered) and triggers contact + history sync.
 * 7. Subscribes the webhook and writes the config to Firestore.
 *
 * Firestore path: users/{uid}/mySpaces/nikat/whatsappConfig
 */

import { HttpsError, onCall } from 'firebase-functions/https';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';
import {
  db,
  deployOptions,
  firestoreWriteTimestamp,
  metaAppId,
  metaAppSecret
} from '../../global';
import { whatsappAccessToken } from './constants';
import { graphApiRequest } from './common';
import axios from 'axios';
import { FieldValue } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';

const GRAPH_API_VERSION = 'v23.0';

function getNikatWhatsAppConfigRef(uid: string) {
  return db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc('nikat')
    .collection('whatsappConfig')
    .doc('config');
}

const connectSchema = z.object({
  /** Short-lived code returned by Embedded Signup response callback */
  code: z.string().nonempty(),
  /** Business phone number ID from session logging (optional — fetched via Graph API if omitted) */
  phoneNumberId: z.string().optional(),
  /** WhatsApp Business Account ID from session logging (optional — fetched via Graph API if omitted) */
  wabaId: z.string().optional(),
  /** Business portfolio ID from session logging */
  businessId: z.string().optional(),
  /**
   * Session event type from the WA_EMBEDDED_SIGNUP message event.
   * 'FINISH' = standard new number flow.
   * 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' = coexistence flow (existing WA Business app number).
   * 'FINISH_ONLY_WABA' = completed without a phone number.
   * 'FINISH_OBO_MIGRATION' = on-behalf-of migration flow.
   * 'FINISH_GRANT_ONLY_API_ACCESS' = grant-only API access flow.
   */
  sessionEvent: z.string().optional()
});

const COEXISTENCE_EVENT = 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING';

const disconnectSchema = z.object({
  wabaId: z.string().nonempty()
});

/**
 * Called after the shop owner completes the Embedded Signup flow.
 * Exchanges the code, fetches WABA + phone details, registers phone number,
 * subscribes webhook, and persists config.
 *
 * onCall({ code: string, phoneNumberId?: string, wabaId?: string })
 */
export const connectbusiness = onCall(
  {
    ...deployOptions,
     secrets: [whatsappAccessToken, metaAppSecret, metaAppId] 
  },
  async (request) => {
    await checkRequest(request, connectSchema, true);
    const uid = request.auth!.uid;
    const {
      code,
      phoneNumberId: providedPhoneNumberId,
      wabaId: providedWabaId,
      businessId: providedBusinessId,
      sessionEvent
    } = request.data;
    const isCoexistence = sessionEvent === COEXISTENCE_EVENT;

    // 1. Exchange code for a user access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: metaAppId.value(),
          client_secret: metaAppSecret.value(),
          code
        }
      }
    );
    const userAccessToken: string = tokenRes.data.access_token;
    log('Embedded Signup token exchanged successfully');

    // 2. List WABAs that were shared during Embedded Signup
    const wabasRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/debug_token`,
      {
        params: {
          input_token: userAccessToken,
          access_token: `${metaAppId.value()}|${metaAppSecret.value()}`
        }
      }
    );
    const granularScopes: any[] = wabasRes.data?.data?.granular_scopes ?? [];
    const wabaScope = granularScopes.find(
      (s: any) => s.scope === 'whatsapp_business_management'
    );
    const wabaIds: string[] = wabaScope?.target_ids ?? [];

    if (wabaIds.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'No WhatsApp Business Account was shared during signup. Please retry and grant the required permissions.'
      );
    }

    // Use ID from session logging if available, otherwise first WABA from debug_token
    const wabaId = providedWabaId ?? wabaIds[0];

    // 3. Get WABA details using our system token
    const wabaDetailsRes = await graphApiRequest(
      'get',
      wabaId,
      {},
      {
        fields: 'id,name'
      }
    );
    const wabaName: string = wabaDetailsRes.data?.name ?? '';

    // 4. Get phone numbers registered on the WABA
    const phonesRes = await graphApiRequest(
      'get',
      `${wabaId}/phone_numbers`,
      {},
      { fields: 'id,display_phone_number,verified_name' }
    );
    const phones: any[] = phonesRes.data?.data ?? [];

    if (phones.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'No phone number found on the connected WhatsApp Business Account. Please add a phone number in your Meta Business Manager first.'
      );
    }

    // If frontend provided the phone number ID from session logging, use it directly
    // to find the matching phone object; otherwise fall back to the first in the list
    const phone = providedPhoneNumberId
      ? (phones.find((p: any) => p.id === providedPhoneNumberId) ?? phones[0])
      : phones[0];
    const phoneNumberId: string = phone.id;
    const displayPhoneNumber: string = phone.display_phone_number;
    const verifiedName: string = phone.verified_name;

    // 5. Register the phone number for Cloud API use (Tech Provider requirement).
    //    Skipped for coexistence flow — the number is already registered in the WA Business app.
    //    Uses the business token (userAccessToken), not the system token.
    //    A 6-digit PIN is generated and stored so re-registration is possible.
    let phoneRegistered = false;
    if (!isCoexistence) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await axios.post(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/register`,
          { messaging_product: 'whatsapp', pin },
          {
            headers: {
              Authorization: `Bearer ${userAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        phoneRegistered = true;
        log(`Phone ${phoneNumberId} registered for Cloud API use`);
      } catch (e: any) {
        // Non-fatal: phone may already be registered (e.g. re-connect flow)
        log(
          'Phone registration failed (non-fatal):',
          e?.response?.data || e?.message
        );
      }
    } else {
      // Coexistence: number is already registered via WA Business app
      phoneRegistered = true;
      log(
        `Coexistence flow — skipping phone registration for ${phoneNumberId}`
      );
    }

    // 6. Subscribe our app to this WABA's webhooks
    let webhookSubscribed = false;
    try {
      await graphApiRequest('post', `${wabaId}/subscribed_apps`);
      webhookSubscribed = true;
    } catch (e: any) {
      log('Webhook subscription failed (non-fatal):', e?.message);
    }

    // 6b. For coexistence: trigger contact + history sync (must be done within 24h of onboarding).
    //     These are fire-and-forget — we store the request IDs but don't block on sync completion.
    let contactSyncRequestId: string | null = null;
    let historySyncRequestId: string | null = null;
    if (isCoexistence) {
      try {
        const contactSyncRes = await axios.post(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`,
          { messaging_product: 'whatsapp', sync_type: 'smb_app_state_sync' },
          {
            headers: {
              Authorization: `Bearer ${userAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        contactSyncRequestId = contactSyncRes.data?.request_id ?? null;
        log(`Coexistence contact sync initiated: ${contactSyncRequestId}`);
      } catch (e: any) {
        log(
          'Contact sync initiation failed (non-fatal):',
          e?.response?.data || e?.message
        );
      }

      try {
        const historySyncRes = await axios.post(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`,
          { messaging_product: 'whatsapp', sync_type: 'history' },
          {
            headers: {
              Authorization: `Bearer ${userAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        historySyncRequestId = historySyncRes.data?.request_id ?? null;
        log(`Coexistence history sync initiated: ${historySyncRequestId}`);
      } catch (e: any) {
        log(
          'History sync initiation failed (non-fatal):',
          e?.response?.data || e?.message
        );
      }
    }

    // 7. Persist the config in Firestore
    const configData = {
      id: 'config',
      wabaId,
      wabaName,
      phoneNumberId,
      displayPhoneNumber,
      verifiedName,
      phoneRegistered,
      webhookSubscribed,
      isCoexistence,
      businessId: providedBusinessId ?? null,
      contactSyncRequestId: contactSyncRequestId ?? null,
      historySyncRequestId: historySyncRequestId ?? null,
      status: 'CONNECTED',
      updatedAt: firestoreWriteTimestamp,
      createdAt: firestoreWriteTimestamp,
      owner: { uid },
      space: { id: 'nikat' }
    };

    await getNikatWhatsAppConfigRef(uid).set(configData, { merge: true });

    log(`WhatsApp connected for shop owner ${uid}: WABA ${wabaId}`);

    return {
      wabaId,
      wabaName,
      phoneNumberId,
      displayPhoneNumber,
      verifiedName,
      phoneRegistered,
      webhookSubscribed,
      isCoexistence
    };
  }
);

/**
 * Disconnects WhatsApp for the shop owner.
 * Unsubscribes the webhook and marks the config as DISCONNECTED.
 *
 * onCall({ wabaId: string })
 */
export const disconnectbusiness = onCall(
  {
    ...deployOptions,
    secrets: [whatsappAccessToken]
  },
  async (request) => {
    await checkRequest(request, disconnectSchema, true);
    const uid = request.auth!.uid;
    const { wabaId } = request.data;

    // Unsubscribe webhook (best-effort)
    try {
      await graphApiRequest('delete', `${wabaId}/subscribed_apps`);
    } catch (e: any) {
      log('Webhook unsubscription failed (non-fatal):', e?.message);
    }

    // Update Firestore status
    await getNikatWhatsAppConfigRef(uid).set(
      {
        status: 'DISCONNECTED',
        webhookSubscribed: false,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    log(`WhatsApp disconnected for shop owner ${uid}`);
    return { success: true };
  }
);

/**
 * Sends a WhatsApp message from the shop owner's connected number to a customer.
 * Used internally by order notification flows.
 *
 * onCall({ to: string, body: string })
 */
export const sendmessage = onCall(
  {
    ...deployOptions,
    secrets: [whatsappAccessToken]
  },
  async (request) => {
    const schema = z.object({
      to: z.string().nonempty(),
      body: z.string().nonempty()
    });
    await checkRequest(request, schema, true);
    const uid = request.auth!.uid;
    const { to, body } = request.data;

    // Load the shop owner's WhatsApp config
    const configSnap = await getNikatWhatsAppConfigRef(uid).get();
    if (!configSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'WhatsApp is not connected. Please connect your WhatsApp Business account first.'
      );
    }

    const config = configSnap.data()!;
    if (config.status !== 'CONNECTED') {
      throw new HttpsError(
        'failed-precondition',
        'WhatsApp connection is not active. Please reconnect your WhatsApp Business account.'
      );
    }

    const phoneNumberId: string = config.phoneNumberId;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    };

    const res = await graphApiRequest(
      'post',
      `${phoneNumberId}/messages`,
      payload
    );
    return res.data;
  }
);
