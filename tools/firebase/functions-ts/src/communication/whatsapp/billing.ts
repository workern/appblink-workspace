import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../utils';

/**
 * Retrieve extended credit lines for a business
 */
export const getCreditLines = onCall(async (request) => {
  const schema = z.object({ businessId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { businessId } = request.data;
  const res = await graphApiRequest('get', `${businessId}/extendedcredits`);
  return res.data;
});
