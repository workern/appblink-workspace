import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../utils/data.utils';
import axios from 'axios';
import { whatsappAccessToken } from './constants';
import { logger } from 'firebase-functions';

// Upload any media (image, sticker, audio, document, video)
export const uploadMedia = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    messaging_product: z.literal('whatsapp'),
    file: z.any()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, messaging_product, file } = request.data;
  const form = new FormData();
  form.append('messaging_product', messaging_product);
  form.append('file', file);
  const res = await graphApiRequest('post', `${phoneNumberId}/media`, form);
  return res.data;
});

// Retrieve media URL and metadata
export const getMediaUrl = onCall(async (request) => {
  const schema = z.object({
    mediaId: z.string().nonempty(),
    phoneNumberId: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { mediaId, phoneNumberId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${mediaId}`,
    {},
    { phone_number_id: phoneNumberId }
  );
  return res.data;
});

// Delete media
export const deleteMedia = onCall(async (request) => {
  const schema = z.object({
    mediaId: z.string().nonempty(),
    phoneNumberId: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { mediaId, phoneNumberId } = request.data;
  const res = await graphApiRequest(
    'delete',
    `${mediaId}`,
    {},
    { phone_number_id: phoneNumberId }
  );
  return res.data;
});

// Download media content
export const downloadMedia = onCall(async (request) => {
  const schema = z.object({ url: z.string().url() });
  await checkRequest(request, schema, true);
  const { url } = request.data;
  try {
    const downloadRes = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { Authorization: `Bearer ${whatsappAccessToken}` }
    });
    return { data: downloadRes.data, headers: downloadRes.headers };
  } catch (err) {
    logger.error('Download media error:', err.response?.data || err.message);
    throw new Error(err.message);
  }
});
