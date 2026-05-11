import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';

export const getBlockedUsers = onCall(async (request) => {
  const schema = z.object({ phoneNumberId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest('get', `${phoneNumberId}/block_users`);
  return res.data;
});

export const blockUsers = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    block_users: z.array(z.object({ user: z.string().nonempty() }))
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/block_users`,
    payload
  );
  return res.data;
});

export const unblockUsers = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    block_users: z.array(z.object({ user: z.string().nonempty() }))
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'delete',
    `${phoneNumberId}/block_users`,
    payload
  );
  return res.data;
});
