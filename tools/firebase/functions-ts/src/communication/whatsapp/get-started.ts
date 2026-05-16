import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../utils';

// Zod schemas for request validation
const subscribeSchema = z.object({ wabaId: z.string().nonempty() });
const phoneIdsSchema = z.object({ wabaId: z.string().nonempty() });
const registerSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  pin: z.string().regex(/^\\d{6}$/, 'Pin must be 6 digits')
});
const sendTestSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  to: z.string().nonempty()
});

/**
 * Subscribe to your WABA for webhooks
 * Expects: { wabaId: string }
 */
export const subscribeToYourWABA = onCall(async (request) => {
  await checkRequest(request, subscribeSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('post', `${wabaId}/subscribed_apps`);
  return res.data;
});

/**
 * Get Phone Number IDs for a WABA
 * Expects: { wabaId: string }
 */
export const getPhoneNumberIDs = onCall(async (request) => {
  await checkRequest(request, phoneIdsSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('get', `${wabaId}/phone_numbers`);
  return res.data;
});

/**
 * Register a phone number (two-step verification)
 * Expects: { phoneNumberId: string, pin: string }
 */
export const registerPhoneNumber = onCall(async (request) => {
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
 * Send a test template message (hello_world)
 * Expects: { phoneNumberId: string, to: string }
 */
export const sendTestMessage = onCall(async (request) => {
  await checkRequest(request, sendTestSchema, true);
  const { phoneNumberId, to } = request.data;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: 'hello_world', language: { code: 'en_US' } }
  };
  const res = await graphApiRequest('post', `${phoneNumberId}/messages`, body);
  return res.data;
});
