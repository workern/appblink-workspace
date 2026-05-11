import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';

/**
 * Retrieve message analytics for a WhatsApp Business Account
 */
export const getAnalytics = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    start: z.number(),
    end: z.number(),
    granularity: z.enum(['DAY', 'LIFETIME', 'MONTHLY']),
    phoneNumbers: z.array(z.string()).optional(),
    countryCodes: z.array(z.string()).optional()
  });
  await checkRequest(request, schema, true);
  const {
    wabaId,
    start,
    end,
    granularity,
    phoneNumbers = [],
    countryCodes = []
  } = request.data;
  const fields = `analytics.start(${start}).end(${end}).granularity(${granularity}).phone_numbers(${JSON.stringify(phoneNumbers)}).country_codes(${JSON.stringify(countryCodes)})`;
  const res = await graphApiRequest('get', `${wabaId}`, {}, { fields });
  return res.data.analytics;
});

/**
 * Retrieve conversation analytics for a WhatsApp Business Account
 */
export const getConversationAnalytics = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    start: z.number(),
    end: z.number(),
    granularity: z.enum(['DAY', 'MONTHLY', 'LIFETIME']),
    conversationDirections: z.array(z.string()),
    dimensions: z.array(z.string())
  });
  await checkRequest(request, schema, true);
  const {
    wabaId,
    start,
    end,
    granularity,
    conversationDirections,
    dimensions
  } = request.data;
  const fields = `conversation_analytics.start(${start}).end(${end}).granularity(${granularity}).conversation_directions(${JSON.stringify(conversationDirections)}).dimensions(${JSON.stringify(dimensions)})`;
  const res = await graphApiRequest('get', `${wabaId}`, {}, { fields });
  return res.data.conversation_analytics;
});
