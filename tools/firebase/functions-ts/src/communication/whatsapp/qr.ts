import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';

export const getQrCode = onCall(async (request) => {
  const schema = z.object({
    code: z.string().nonempty(),
    phoneNumberId: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, code } = request.data;
  const res = await graphApiRequest(
    'get',
    `${phoneNumberId}/message_qrdls/${code}`
  );
  return res.data;
});

export const listQrCodes = onCall(async (request) => {
  const schema = z.object({ phoneNumberId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest('get', `${phoneNumberId}/message_qrdls`);
  return res.data;
});

export const listQrCodesWithFields = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    fields: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, fields } = request.data;
  const res = await graphApiRequest(
    'get',
    `${phoneNumberId}/message_qrdls`,
    {},
    { fields }
  );
  return res.data;
});

export const createQrCode = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    prefilled_message: z.string().nonempty(),
    generate_qr_image: z.enum(['SVG', 'PNG']).optional()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/message_qrdls`,
    payload
  );
  return res.data;
});

export const updateQrCode = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    code: z.string().nonempty(),
    prefilled_message: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/message_qrdls`,
    payload
  );
  return res.data;
});

export const deleteQrCode = onCall(async (request) => {
  const schema = z.object({
    code: z.string().nonempty(),
    phoneNumberId: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, code } = request.data;
  const res = await graphApiRequest(
    'delete',
    `${phoneNumberId}/message_qrdls/${code}`
  );
  return res.data;
});
