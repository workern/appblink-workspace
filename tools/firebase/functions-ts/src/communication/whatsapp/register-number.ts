import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { checkRequest } from '../../utils';
import { z } from 'zod';

const registerSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  pin: z.string().regex(/^\d{6}$/, 'Pin must be 6 digits')
});
const deregisterSchema = z.object({ phoneNumberId: z.string().nonempty() });

/**
 * Register a phone number (two-step verification)
 * Expects: { phoneNumberId: string, pin: string }
 */
export const registerPhone = onCall(async (request) => {
  await checkRequest(request, registerSchema, true);
  const { phoneNumberId, pin } = request.data;
  const payload = { messaging_product: 'whatsapp', pin };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/register`,
    payload
  );
  return res.data;
});

/**
 * Deregister a phone number
 * Expects: { phoneNumberId: string }
 */
export const deregisterPhone = onCall(async (request) => {
  await checkRequest(request, deregisterSchema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest('post', `${phoneNumberId}/deregister`);
  return res.data;
});
