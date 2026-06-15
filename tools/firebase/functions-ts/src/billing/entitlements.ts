import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { checkRequest } from '../utils/data.utils';
import { db, deployOptions } from '../global';
import { BillingEntitlement } from '@workern/models';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const getEntitlementsSchema = z.object({
  appId: z.string().min(1),
  secret: z.literal('shambho').optional()
});

const entitlementPayloadSchema = z.object({
  appId: z.string().min(1),
  name: z.string().min(1),
  features: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const createEntitlementSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  entitlement: entitlementPayloadSchema,
  secret: z.literal('shambho').optional()
});

const updateEntitlementSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  entitlement: entitlementPayloadSchema.partial().omit({ appId: true }),
  secret: z.literal('shambho').optional()
});

const deleteEntitlementSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  secret: z.literal('shambho').optional()
});

// ─── Auth helpers (mirrors products.ts pattern) ────────────────────────────────

function getEntitlementRef(entitlementId: string) {
  return db.collection('entitlements').doc(entitlementId);
}

// ─── Cloud Functions ───────────────────────────────────────────────────────────

export const getentitlements = onCall(
  { ...deployOptions, region: 'asia-south2' },
  async (
    request
  ): Promise<{ appId: string; entitlements: BillingEntitlement[] }> => {
    await checkRequest(request, getEntitlementsSchema, false);

    const { appId } = getEntitlementsSchema.parse(request.data);

    const snapshot = await db
      .collection('entitlements')
      .where('appId', '==', appId)
      .get();

    const entitlements: BillingEntitlement[] = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as BillingEntitlement)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return { appId, entitlements };
  }
);

export const createentitlement = onCall(
  { ...deployOptions, region: 'asia-south2' },
  async (request): Promise<{ success: boolean; entitlementId: string }> => {
    await checkRequest(request, createEntitlementSchema, false);

    const { appId, entitlementId, entitlement } = createEntitlementSchema.parse(
      request.data
    );

    if (entitlement.appId !== appId) {
      throw new HttpsError(
        'invalid-argument',
        'entitlement.appId must match appId in request'
      );
    }

    const ref = getEntitlementRef(entitlementId);
    const snap = await ref.get();
    if (snap.exists) {
      throw new HttpsError(
        'already-exists',
        `Entitlement "${entitlementId}" already exists`
      );
    }

    await ref.set({
      ...entitlement,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true, entitlementId };
  }
);

export const updateentitlement = onCall(
  { ...deployOptions, region: 'asia-south2' },
  async (request): Promise<{ success: boolean; entitlementId: string }> => {
    await checkRequest(request, updateEntitlementSchema, false);

    const { appId, entitlementId, entitlement } = updateEntitlementSchema.parse(
      request.data
    );

    const ref = getEntitlementRef(entitlementId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError(
        'not-found',
        `Entitlement "${entitlementId}" not found`
      );
    }

    if (snap.data()?.appId !== appId) {
      throw new HttpsError(
        'permission-denied',
        'Entitlement does not belong to this app'
      );
    }

    await ref.set(
      { ...entitlement, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return { success: true, entitlementId };
  }
);

export const deleteentitlement = onCall(
  { ...deployOptions, region: 'asia-south2' },
  async (request): Promise<{ success: boolean; entitlementId: string }> => {
    await checkRequest(request, deleteEntitlementSchema, false);

    const { appId, entitlementId } = deleteEntitlementSchema.parse(
      request.data
    );

    const ref = getEntitlementRef(entitlementId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError(
        'not-found',
        `Entitlement "${entitlementId}" not found`
      );
    }

    if (snap.data()?.appId !== appId) {
      throw new HttpsError(
        'permission-denied',
        'Entitlement does not belong to this app'
      );
    }

    // Guard against deletion when products still exist under this entitlement
    const productsSnap = await ref.collection('products').limit(1).get();
    if (!productsSnap.empty) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot delete entitlement with existing products. Delete all products first.'
      );
    }

    await ref.delete();

    return { success: true, entitlementId };
  }
);
