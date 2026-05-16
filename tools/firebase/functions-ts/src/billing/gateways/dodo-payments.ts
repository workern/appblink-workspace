import { HttpsError, onCall } from 'firebase-functions/v2/https';
import axios from 'axios';
import { dodoApiKey, isProduction } from '../../global';
import { checkRequest, getUser } from '../../utils';
import { z } from 'zod';

// Initialize Dodo API client
const DODO_API_BASE_URL = isProduction
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com'; // or use test URL if needed

export async function createDodoSubscriptionSession(details: {
  uid: string;
  productId: string;
}) {
  const { uid, productId } = details;
  const { email, name } = (await getUser(uid)) as any;

  if (!email || !name || !productId) {
    throw new HttpsError(
      'invalid-argument',
      'Missing required fields: email, name, productId'
    );
  }

  const apiKey = dodoApiKey.value();
  if (!apiKey) {
    throw new HttpsError('internal', 'Dodo API key is not set');
  }

  try {
    const customerRes = await axios.post(
      `${DODO_API_BASE_URL}/customers`,
      { email, name },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );
    const customer = customerRes.data;

    const subscriptionRes = await axios.post(
      `${DODO_API_BASE_URL}/subscriptions`,
      {
        customer: {
          customer_id: customer.id
        },
        product: {
          product_id: productId,
          quantity: 1
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    return subscriptionRes.data;
  } catch (error: any) {
    console.error('Dodo API error:', error?.response?.data || error.message);
    throw new HttpsError(
      'internal',
      error?.response?.data?.message || 'Subscription creation failed'
    );
  }
}

export const createDodoSubscription = onCall(
  {
    enforceAppCheck: true,
    secrets: [dodoApiKey]
  },
  async (request) => {
    const { productId } = request.data;
    const uid = request.auth?.uid as string;
    const schema = z.object({
      productId: z.string().min(1, 'Product ID is required')
    });
    checkRequest(request, schema, true);
    try {
      const subscription = await createDodoSubscriptionSession({
        uid,
        productId
      });
      return {
        success: true,
        subscription
      };
    } catch (error) {
      throw error;
    }
  }
);
