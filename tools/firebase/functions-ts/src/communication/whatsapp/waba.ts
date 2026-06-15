import { onCall } from 'firebase-functions/https';
import { z } from 'zod';
import { checkRequest } from '../../utils/data.utils';
import { graphApiRequest } from './common';

// Zod schemas for request validation
const wabaSchema = z.object({ wabaId: z.string().nonempty() });
const businessSchema = z.object({ businessId: z.string().nonempty() });

/**
 * Get WhatsApp Business Account details
 * Expects: { wabaId: string }
 */
export const getWabaDetails = onCall(async (request) => {
  await checkRequest(request, wabaSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('get', `${wabaId}`);
  return res.data;
});

/**
 * List WABAs owned by a Business Manager
 * Expects: { businessId: string }
 */
export const listOwnedWabas = onCall(async (request) => {
  await checkRequest(request, businessSchema, true);
  const { businessId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${businessId}/owned_whatsapp_business_accounts`
  );
  return res.data;
});

/**
 * List WABAs shared with a Business Manager (client WABAs)
 * Expects: { businessId: string }
 */
export const listSharedWabas = onCall(async (request) => {
  await checkRequest(request, businessSchema, true);
  const { businessId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${businessId}/client_whatsapp_business_accounts`
  );
  return res.data;
});
