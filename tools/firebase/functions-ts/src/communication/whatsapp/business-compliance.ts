import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';

/**
 * Retrieve India-based business compliance information for a phone number
 */
export const getBusinessComplianceInfo = onCall(async (request) => {
  const schema = z.object({ phoneNumberId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${phoneNumberId}/business_compliance_info`
  );
  return res.data;
});

/**
 * Add or update India-based business compliance information for a phone number
 */
export const addBusinessComplianceInfo = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    messaging_product: z.literal('whatsapp'),
    entity_name: z.string().nonempty(),
    entity_type: z.string().nonempty(),
    is_registered: z.boolean(),
    grievance_officer_details: z.object({
      name: z.string(),
      email: z.string().email(),
      landline_number: z.string(),
      mobile_number: z.string()
    }),
    customer_care_details: z.object({
      email: z.string().email(),
      landline_number: z.string(),
      mobile_number: z.string()
    })
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/business_compliance_info`,
    payload
  );
  return res.data;
});
