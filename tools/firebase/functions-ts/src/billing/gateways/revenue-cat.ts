/**
 * RevenueCat Webhook Handler
 *
 * Listens for subscription lifecycle events from RevenueCat (App Store + Play
 * Store) and keeps Firebase custom claims in sync — exactly the same way the
 * Razorpay and LemonSqueezy gateways do via activateAppProductEntitlement /
 * revokeAppProductEntitlement in common.ts.
 *
 * Setup (one-time):
 *   1. Set the Firebase secret:
 *        firebase functions:secrets:set REVENUE_CAT_WEBHOOK_SECRET
 *   2. In the RevenueCat dashboard → Project → Integrations → Webhooks,
 *      point the URL to this function and paste the same secret as the
 *      "Authorization header" value.
 *   3. Add your RC app IDs to RC_APP_ID_MAP below so events map to the
 *      correct workern APPID (e.g. 'saveNestApp').
 *
 * Event handling:
 *   ACTIVATE  → INITIAL_PURCHASE, RENEWAL, UNCANCELLATION,
 *               NON_RENEWING_PURCHASE, SUBSCRIPTION_EXTENDED,
 *               TEMPORARY_ENTITLEMENT_GRANT
 *   REVOKE    → EXPIRATION  (authoritative "access off" signal from RC)
 *   LOG-ONLY  → CANCELLATION (access continues until EXPIRATION fires)
 *   SKIP      → TEST, BILLING_ISSUE, PRODUCT_CHANGE, SUBSCRIPTION_PAUSED,
 *               EXPERIMENT_ENROLLMENT, VIRTUAL_CURRENCY_TRANSACTION,
 *               INVOICE_ISSUANCE, SUBSCRIBER_ALIAS
 */

import { onRequest } from 'firebase-functions/v2/https';
import { log, error, warn } from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';
import {
  db,
  deployOptions,
  REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE,
  REVENUE_CAT_API_KEY
} from '../../global';
import {
  activateAppProductEntitlement,
  revokeAppProductEntitlement
} from './common';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Entitlement ID → workern APPID: resolved dynamically from Firestore.
// The `entitlements/{entitlementId}` document carries an `appId` field that
// is the canonical source of truth — no hardcoded map needed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event classification
// ---------------------------------------------------------------------------
const ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT'
]);

const REVOKE_EVENTS = new Set(['EXPIRATION']);

const SKIP_EVENTS = new Set([
  'TEST',
  'BILLING_ISSUE', // Do not revoke — grace period may still be active
  'PRODUCT_CHANGE', // Change takes effect on next cycle; RC handles access
  'SUBSCRIPTION_PAUSED', // Revoke fires on subsequent EXPIRATION event
  'EXPERIMENT_ENROLLMENT',
  'VIRTUAL_CURRENCY_TRANSACTION',
  'INVOICE_ISSUANCE',
  'SUBSCRIBER_ALIAS'
]);

// ---------------------------------------------------------------------------
// TypeScript types (mirrors RC webhook payload)
// ---------------------------------------------------------------------------
interface RCEvent {
  id: string;
  type: string;
  app_id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_id?: string | null;
  entitlement_ids?: string[] | null;
  store?: string;
  environment?: string;
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  transaction_id?: string;
  original_transaction_id?: string;
  cancel_reason?: string;
  expiration_reason?: string;
  price?: number;
  currency?: string;
  is_family_share?: boolean;
  transferred_from?: string[];
  transferred_to?: string[];
  grace_period_expiration_at_ms?: number | null;
  new_product_id?: string;
  renewal_number?: number;
  is_trial_conversion?: boolean;
  [key: string]: any;
}

interface RCWebhookBody {
  api_version: string;
  event: RCEvent;
}

// ---------------------------------------------------------------------------
// RevenueCat API Helper Functions
// ---------------------------------------------------------------------------

const RC_API_BASE_URL = 'https://api.revenuecat.com/v1';

/**
 * Gets the configured RevenueCat API key from Firebase secrets.
 * Returns null if not configured (e.g., in emulator or key not set).
 */
function getRevenueCatApiKey(): string | null {
  try {
    return REVENUE_CAT_API_KEY.value();
  } catch (err) {
    warn('RevenueCat API key not configured:', err);
    return null;
  }
}

/**
 * Gets or creates a customer in RevenueCat.
 * This ensures the customer exists before granting/revoking entitlements.
 *
 * @param appUserId - The Firebase UID (app_user_id in RevenueCat)
 * @returns The customer data from RevenueCat, or null if API call fails
 */
export async function getOrCreateRevenueCatCustomer(
  appUserId: string
): Promise<any | null> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    log('RevenueCat API key not configured, skipping customer fetch');
    return null;
  }

  try {
    const url = `${RC_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    log(`RevenueCat customer fetched/created: ${appUserId}`);
    return response.data;
  } catch (err: any) {
    error(
      `Failed to get/create RevenueCat customer for ${appUserId}:`,
      err.response?.data || err.message
    );
    return null;
  }
}

/**
 * Grants a promotional entitlement to a customer in RevenueCat.
 *
 * @param appUserId - The Firebase UID (app_user_id in RevenueCat)
 * @param entitlementId - The entitlement identifier in RevenueCat
 * @param endTimeMs - Unix epoch in milliseconds when entitlement expires (optional, defaults to 1 year)
 * @returns True if successful, false otherwise
 */
export async function grantRevenueCatEntitlement(
  appUserId: string,
  entitlementId: string,
  entitlementPeriodInMs?: number
): Promise<boolean> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    log('RevenueCat API key not configured, skipping entitlement grant');
    return false;
  }

  // Ensure customer exists first
  await getOrCreateRevenueCatCustomer(appUserId);
  log(
    `Granting RevenueCat entitlement: ${entitlementId} to ${appUserId} for ${entitlementPeriodInMs ?? 'default period'} ms`
  );
  try {
    const url = `${RC_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`;

    // Default to 1 month from now if no end time specified
    const expirationTime = entitlementPeriodInMs
      ? Date.now() + entitlementPeriodInMs
      : Date.now() + 30 * 24 * 60 * 60 * 1000;

    const response = await axios.post(
      url,
      {
        end_time_ms: expirationTime
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    log(
      `RevenueCat entitlement granted: ${entitlementId} to ${appUserId} until ${new Date(expirationTime).toISOString()}`
    );
    return true;
  } catch (err: any) {
    error(
      `Failed to grant RevenueCat entitlement ${entitlementId} to ${appUserId}:`,
      err.response?.data || err.message
    );
    return false;
  }
}

/**
 * Revokes all promotional entitlements for a given entitlement identifier.
 *
 * @param appUserId - The Firebase UID (app_user_id in RevenueCat)
 * @param entitlementId - The entitlement identifier in RevenueCat
 * @returns True if successful, false otherwise
 */
export async function revokeRevenueCatEntitlement(
  appUserId: string,
  entitlementId: string
): Promise<boolean> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    log('RevenueCat API key not configured, skipping entitlement revoke');
    return false;
  }

  try {
    const url = `${RC_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/revoke_promotionals`;

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    log(`RevenueCat entitlement revoked: ${entitlementId} from ${appUserId}`);
    return true;
  } catch (err: any) {
    error(
      `Failed to revoke RevenueCat entitlement ${entitlementId} from ${appUserId}:`,
      err.response?.data || err.message
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main webhook handler
// ---------------------------------------------------------------------------
export const webhookHandler = onRequest(
  {
    ...deployOptions,
    memory: '512MiB',
    region: 'asia-south2',
    secrets: [REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE, REVENUE_CAT_API_KEY]
  },
  async (req, res) => {
    // ── 1. Method guard ──────────────────────────────────────────────────
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // ── 2. Shared-secret verification ────────────────────────────────────
    // RevenueCat sends the raw secret string in the Authorization header.
    const authHeader = req.get('Authorization') ?? '';
    const expectedValue = REVENUE_CAT_WEBHOOK_AUTHORIZATION_HEADER_VALUE.value();

    if (!authHeader || authHeader !== expectedValue) {
      warn('RevenueCat webhook: invalid or missing Authorization header');
      res.status(401).send('Unauthorized');
      return;
    }

    // ── 3. Parse body ────────────────────────────────────────────────────
    const body = req.body as RCWebhookBody;
    const event = body?.event;

    if (!event?.type) {
      res.status(400).send('Missing event body or event.type');
      return;
    }

    const {
      id: eventId,
      type: eventType,
      app_id: rcAppId,
      app_user_id: uid,
      product_id: productId,
      entitlement_ids: entitlementIds,
      environment,
      store,
      cancel_reason: cancelReason,
      expiration_reason: expirationReason,
      transferred_from: transferredFrom,
      transferred_to: transferredTo
    } = event;

    log(
      `RevenueCat webhook received | type=${eventType} uid=${uid ?? 'n/a'} ` +
        `product=${productId ?? 'n/a'} env=${environment ?? 'n/a'} ` +
        `store=${store ?? 'n/a'} eventId=${eventId}`
    );

    try {
      // ── 4. Skip events we deliberately don't act on ───────────────────
      if (SKIP_EVENTS.has(eventType)) {
        log(`Skipping event type: ${eventType}`);
        res.status(200).send({ handled: false, reason: 'skipped_type' });
        return;
      }

      // ── 5. TRANSFER (no app_user_id — just audit log) ─────────────────
      if (eventType === 'TRANSFER') {
        await db
          .collection('revenueCatEvents')
          .doc(eventId)
          .set({
            type: eventType,
            transferredFrom: transferredFrom ?? [],
            transferredTo: transferredTo ?? [],
            rcAppId: rcAppId ?? null,
            environment: environment ?? null,
            status: 'transfer_logged',
            receivedAt: FieldValue.serverTimestamp()
          });
        log(`TRANSFER logged | from=${transferredFrom} to=${transferredTo}`);
        res.status(200).send({ handled: true, type: eventType });
        return;
      }

      // ── 6. All other events require app_user_id (= Firebase UID) ─────
      if (!uid) {
        warn(`Missing app_user_id for event type=${eventType} id=${eventId}`);
        res.status(400).send('Missing app_user_id');
        return;
      }

      // ── 7. Resolve entitlementId ────────────────────────────────────────
      // Prefer the first RC entitlement_id; fall back to productId.
      // appId is NOT pre-resolved here — activateAppProductEntitlement /
      // revokeAppProductEntitlement will look it up from entitlements/{id} in
      // Firestore automatically when notes.appId is absent.
      const entitlementId = entitlementIds?.[0] ?? productId ?? null;

      // notes mirrors the shape expected by activateAppProductEntitlement /
      // revokeAppProductEntitlement in common.ts.
      const notes: Record<string, any> = {
        productId: productId ?? null,
        entitlementId,
        rcEventType: eventType,
        store: store ?? null,
        environment: environment ?? null
      };

      // ── 8. Activate ───────────────────────────────────────────────────
      if (ACTIVATE_EVENTS.has(eventType)) {
        await activateAppProductEntitlement({ uid, notes });
        await writeEventAuditDoc(uid, eventId, event, 'activated');
        log(
          `Entitlement ACTIVATED | uid=${uid} product=${productId} type=${eventType}`
        );
      }

      // ── 9. Revoke (EXPIRATION only) ───────────────────────────────────
      else if (REVOKE_EVENTS.has(eventType)) {
        const reason = expirationReason ?? eventType;
        await revokeAppProductEntitlement({ uid, notes, reason });
        await writeEventAuditDoc(uid, eventId, event, 'revoked');
        log(
          `Entitlement REVOKED | uid=${uid} product=${productId} reason=${reason}`
        );
      }

      // ── 10. Cancellation — log only, access continues until EXPIRATION ─
      else if (eventType === 'CANCELLATION') {
        await writeEventAuditDoc(uid, eventId, event, 'cancellation_logged');
        log(
          `Cancellation logged (access continues until EXPIRATION) | ` +
            `uid=${uid} product=${productId} cancelReason=${cancelReason ?? 'n/a'}`
        );
      }

      // ── 11. Unknown future event types ────────────────────────────────
      else {
        warn(`Unhandled RevenueCat event type: ${eventType}`);
        await writeEventAuditDoc(uid, eventId, event, 'unhandled');
      }

      res.status(200).send({ handled: true, type: eventType });
    } catch (err: any) {
      error('RevenueCat webhook processing error:', err);
      // Always return 200 to prevent RC from spam-retrying on unexpected errors.
      // The audit doc written earlier (if any) will show status='error'.
      res.status(200).send({ handled: false, error: err.message });
    }
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Writes an idempotent audit record per RC event ID.
 * RC retries deliver the same `id` so this doc will simply be overwritten —
 * no duplicate processing artifacts.
 *
 * Path: revenueCatEvents/{eventId}
 */
async function writeEventAuditDoc(
  uid: string,
  eventId: string,
  event: RCEvent,
  status: string
): Promise<void> {
  await db
    .collection('revenueCatEvents')
    .doc(eventId) // keyed by RC event ID for idempotency
    .set(
      {
        uid,
        type: event.type,
        rcAppId: event.app_id ?? null,
        productId: event.product_id ?? null,
        entitlementIds: event.entitlement_ids ?? null,
        store: event.store ?? null,
        environment: event.environment ?? null,
        periodType: event.period_type ?? null,
        transactionId: event.transaction_id ?? null,
        originalTransactionId: event.original_transaction_id ?? null,
        purchasedAtMs: event.purchased_at_ms ?? null,
        expirationAtMs: event.expiration_at_ms ?? null,
        cancelReason: event.cancel_reason ?? null,
        expirationReason: event.expiration_reason ?? null,
        price: event.price ?? null,
        currency: event.currency ?? null,
        renewalNumber: event.renewal_number ?? null,
        isTrialConversion: event.is_trial_conversion ?? null,
        status,
        receivedAt: FieldValue.serverTimestamp()
      },
      { merge: false } // full overwrite ensures retries don't leave stale fields
    );
}
