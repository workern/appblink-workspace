import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { checkRequest } from '../../utils';
import { z } from 'zod';

const phoneNumbersSchema = z.object({ wabaId: z.string().nonempty() });
const phoneNumberByIdSchema = z.object({
  phoneNumberId: z.string().nonempty()
});
const displayNameSchema = z.object({ phoneNumberId: z.string().nonempty() });
const filterSchema = z.object({
  wabaId: z.string().nonempty(),
  fields: z.string().nonempty(),
  filtering: z.string().nonempty()
});
const requestCodeSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  codeMethod: z.enum(['SMS', 'VOICE']),
  locale: z.string().nonempty()
});
const verifyCodeSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  code: z.string().nonempty()
});
const setPinSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  pin: z.string().regex(/^\d{6}$/, 'Pin must be 6 digits')
});

export const getPhoneNumbers = onCall(async (request) => {
  await checkRequest(request, phoneNumbersSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('get', `${wabaId}/phone_numbers`);
  return res.data;
});

export const getPhoneNumberById = onCall(async (request) => {
  await checkRequest(request, phoneNumberByIdSchema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest('get', `${phoneNumberId}`);
  return res.data;
});

export const getDisplayNameStatus = onCall(async (request) => {
  await checkRequest(request, displayNameSchema);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${phoneNumberId}`,
    {},
    { fields: 'name_status' }
  );
  return res.data;
});

export const getFilteredPhoneNumbers = onCall(async (request) => {
  await checkRequest(request, filterSchema, true);
  const { wabaId, fields, filtering } = request.data;
  const res = await graphApiRequest(
    'get',
    `${wabaId}/phone_numbers`,
    {},
    { fields, filtering }
  );
  return res.data;
});

// --- Verification Endpoints ---
export const requestVerificationCode = onCall(async (request) => {
  await checkRequest(request, requestCodeSchema, true);
  const { phoneNumberId, codeMethod, locale } = request.data;
  const payload = { code_method: codeMethod, locale };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/request_code`,
    payload
  );
  return res.data;
});

export const verifyCode = onCall(async (request) => {
  await checkRequest(request, verifyCodeSchema, true);
  const { phoneNumberId, code } = request.data;
  const res = await graphApiRequest('post', `${phoneNumberId}/verify_code`, {
    code
  });
  return res.data;
});

export const setTwoStepVerification = onCall(async (request) => {
  await checkRequest(request, setPinSchema, true);
  const { phoneNumberId, pin } = request.data;
  const res = await graphApiRequest('post', `${phoneNumberId}`, { pin });
  return res.data;
});
