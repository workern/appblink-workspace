/**
 * gateway-management.ts
 *
 * Cloud Functions for managing external payment gateway products/plans.
 * Lets the App Blink VS Code extension list, create, and link gateway products
 * to billing products stored in Firestore.
 *
 * Supported gateways:
 *   RAZORPAY      – list plans, create plan
 *   STRIPE        – list plans, create plan (uses Plans API for backwards-compat)
 *   DODO_PAYMENTS – list products, create product
 *   LEMON_SQUEEZY – list variants (read-only; creation not supported via API)
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { checkRequest } from '../data-utils';
import {
  db,
  deployOptions,
  isProduction,
  razorpayKeyId,
  razorpayKeySecret,
  lemonSqueezyApiKey,
  dodoApiKey,
  stripeApiKey
} from '../global';
import axios from 'axios';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface GatewayProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  intervalCount?: number;
  active?: boolean;
}

const supportedGatewaySchema = z.enum([
  'RAZORPAY',
  'STRIPE',
  'DODO_PAYMENTS',
  'LEMON_SQUEEZY'
]);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function assertGlobalAdmin(request: any): void {
  if (!request?.auth?.token?.globalAdmin) {
    throw new HttpsError('permission-denied', 'Global admin access required');
  }
}

// ─── Razorpay helpers ─────────────────────────────────────────────────────────

function razorpayAuth() {
  const keyId = isProduction
    ? razorpayKeyId.value()
    : 'rzp_test_Rm3ZpwsyNst8nl';
  const keySecret = isProduction
    ? razorpayKeySecret.value()
    : 'bKqN5kUJ8wmXx5d0RBkS4NXI';
  return { auth: { username: keyId, password: keySecret } };
}

async function listRazorpayPlans(): Promise<GatewayProduct[]> {
  const resp = await axios.get('https://api.razorpay.com/v1/plans', {
    ...razorpayAuth(),
    params: { count: 100 }
  });
  const items: any[] = resp.data?.items ?? [];
  return items.map((p) => ({
    id: p.id,
    name: p.item?.name ?? p.id,
    description: p.item?.description,
    price: p.item?.amount,
    currency: p.item?.currency,
    interval: p.period,
    intervalCount: p.interval,
    active: p.deleted !== true
  }));
}

async function createRazorpayPlan(input: {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
}): Promise<GatewayProduct> {
  const resp = await axios.post(
    'https://api.razorpay.com/v1/plans',
    {
      period: input.period,
      interval: input.interval,
      item: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        currency: input.currency
      }
    },
    razorpayAuth()
  );
  const p = resp.data;
  return {
    id: p.id,
    name: p.item?.name ?? p.id,
    price: p.item?.amount,
    currency: p.item?.currency,
    interval: p.period,
    intervalCount: p.interval
  };
}

// ─── Stripe helpers ───────────────────────────────────────────────────────────

function stripeHeaders() {
  const key = stripeApiKey.value();
  return { Authorization: `Bearer ${key}` };
}

async function listStripePlans(): Promise<GatewayProduct[]> {
  const resp = await axios.get('https://api.stripe.com/v1/plans', {
    headers: stripeHeaders(),
    params: { limit: 100 }
  });
  const data: any[] = resp.data?.data ?? [];
  return data.map((p) => ({
    id: p.id,
    name: p.nickname ?? p.product ?? p.id,
    price: p.amount,
    currency: p.currency,
    interval: p.interval,
    intervalCount: p.interval_count,
    active: p.active
  }));
}

async function createStripePlan(input: {
  name: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  nickname?: string;
}): Promise<GatewayProduct> {
  // Create a product first, then attach a plan to it
  const productResp = await axios.post(
    'https://api.stripe.com/v1/products',
    new URLSearchParams({ name: input.name }),
    { headers: stripeHeaders() }
  );
  const productId = productResp.data.id;

  const planResp = await axios.post(
    'https://api.stripe.com/v1/plans',
    new URLSearchParams({
      currency: input.currency,
      interval: input.interval,
      product: productId,
      amount: String(input.amount),
      ...(input.intervalCount
        ? { interval_count: String(input.intervalCount) }
        : {}),
      ...(input.nickname ? { nickname: input.nickname } : {})
    }),
    { headers: stripeHeaders() }
  );
  const p = planResp.data;
  return {
    id: p.id,
    name: input.nickname ?? input.name,
    price: p.amount,
    currency: p.currency,
    interval: p.interval,
    intervalCount: p.interval_count,
    active: p.active
  };
}

// ─── Dodo Payments helpers ────────────────────────────────────────────────────

function dodoBaseUrl() {
  return isProduction
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

function dodoHeaders() {
  return { Authorization: `Bearer ${dodoApiKey.value()}` };
}

async function listDodoProducts(): Promise<GatewayProduct[]> {
  const resp = await axios.get(`${dodoBaseUrl()}/products`, {
    headers: dodoHeaders(),
    params: { page_size: 100 }
  });
  const items: any[] = resp.data?.items ?? resp.data?.data ?? resp.data ?? [];
  return items.map((p) => ({
    id: p.product_id ?? p.id,
    name: p.name,
    description: p.description,
    price: p.price?.unit_amount ?? p.price,
    currency: p.price?.currency ?? p.currency,
    active: p.is_recurring !== false
  }));
}

async function createDodoProduct(input: {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  interval?: string;
}): Promise<GatewayProduct> {
  const body: any = {
    name: input.name,
    description: input.description,
    price: {
      unit_amount: input.amount,
      currency: input.currency.toLowerCase()
    },
    is_recurring: input.isRecurring
  };
  if (input.isRecurring && input.interval) {
    body.billing_cycle = { interval: input.interval };
  }

  const resp = await axios.post(`${dodoBaseUrl()}/products`, body, {
    headers: dodoHeaders()
  });
  const p = resp.data;
  return {
    id: p.product_id ?? p.id,
    name: p.name,
    description: p.description,
    price: p.price?.unit_amount ?? p.price,
    currency: p.price?.currency ?? p.currency
  };
}

// ─── LemonSqueezy helpers ─────────────────────────────────────────────────────

async function listLemonSqueezyVariants(): Promise<GatewayProduct[]> {
  const apiKey = isProduction
    ? lemonSqueezyApiKey.value()
    : 'test-key-fallback';

  const resp = await axios.get('https://api.lemonsqueezy.com/v1/variants', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json'
    },
    params: { 'page[size]': 100 }
  });

  const data: any[] = resp.data?.data ?? [];
  return data
    .filter((v) => v.attributes?.status !== 'draft')
    .map((v) => ({
      id: v.id,
      name: v.attributes?.name ?? v.id,
      description: v.attributes?.description,
      price: v.attributes?.price,
      currency: 'USD',
      interval: v.attributes?.interval,
      intervalCount: v.attributes?.interval_count,
      active: v.attributes?.status === 'published'
    }));
}

// ─── Fetch Gateway Products (list) ────────────────────────────────────────────

const fetchGatewayProductsSchema = z.object({
  gateway: supportedGatewaySchema,
  secret: z.literal('shambho').optional()
});

export const fetchgatewayproducts = onCall(
  {
    ...deployOptions,
    region: 'asia-south2',
    secrets: [
      razorpayKeyId,
      razorpayKeySecret,
      lemonSqueezyApiKey,
      dodoApiKey,
      stripeApiKey
    ]
  },
  async (request): Promise<{ gateway: string; products: GatewayProduct[] }> => {
    await checkRequest(request, fetchGatewayProductsSchema, false);
    assertGlobalAdmin(request);

    const { gateway } = fetchGatewayProductsSchema.parse(request.data);

    try {
      let products: GatewayProduct[];

      switch (gateway) {
        case 'RAZORPAY':
          products = await listRazorpayPlans();
          break;
        case 'STRIPE':
          products = await listStripePlans();
          break;
        case 'DODO_PAYMENTS':
          products = await listDodoProducts();
          break;
        case 'LEMON_SQUEEZY':
          products = await listLemonSqueezyVariants();
          break;
        default:
          throw new HttpsError(
            'invalid-argument',
            `Unsupported gateway: ${gateway}`
          );
      }

      return { gateway, products };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message;
      throw new HttpsError(
        'internal',
        `Failed to fetch ${gateway} products: ${msg}`
      );
    }
  }
);

// ─── Create Gateway Product ───────────────────────────────────────────────────

const createGatewayProductSchema = z.object({
  gateway: z.enum(['RAZORPAY', 'STRIPE', 'DODO_PAYMENTS']),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  interval: z.string().min(1),
  intervalCount: z.number().int().positive().optional().default(1),
  secret: z.literal('shambho').optional()
});

export const creategatewayproduct = onCall(
  {
    ...deployOptions,
    region: 'asia-south2',
    secrets: [razorpayKeyId, razorpayKeySecret, dodoApiKey, stripeApiKey]
  },
  async (request): Promise<{ gateway: string; product: GatewayProduct }> => {
    await checkRequest(request, createGatewayProductSchema, false);
    assertGlobalAdmin(request);

    const data = createGatewayProductSchema.parse(request.data);

    try {
      let product: GatewayProduct;

      switch (data.gateway) {
        case 'RAZORPAY': {
          const periodMap: Record<
            string,
            'daily' | 'weekly' | 'monthly' | 'yearly'
          > = {
            DAY: 'daily',
            WEEK: 'weekly',
            MONTH: 'monthly',
            YEAR: 'yearly'
          };
          product = await createRazorpayPlan({
            name: data.name,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            period: periodMap[data.interval.toUpperCase()] ?? 'monthly',
            interval: data.intervalCount ?? 1
          });
          break;
        }
        case 'STRIPE': {
          const stripeIntervalMap: Record<
            string,
            'day' | 'week' | 'month' | 'year'
          > = {
            DAY: 'day',
            WEEK: 'week',
            MONTH: 'month',
            YEAR: 'year'
          };
          product = await createStripePlan({
            name: data.name,
            amount: data.amount,
            currency: data.currency.toLowerCase(),
            interval: stripeIntervalMap[data.interval.toUpperCase()] ?? 'month',
            intervalCount: data.intervalCount,
            nickname: data.name
          });
          break;
        }
        case 'DODO_PAYMENTS': {
          product = await createDodoProduct({
            name: data.name,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            isRecurring: true,
            interval: data.interval.toLowerCase()
          });
          break;
        }
        default:
          throw new HttpsError(
            'invalid-argument',
            'LemonSqueezy does not support product creation via API. Please create the product manually at app.lemonsqueezy.com.'
          );
      }

      return { gateway: data.gateway, product };
    } catch (err: any) {
      if (err instanceof HttpsError) throw err;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message;
      throw new HttpsError(
        'internal',
        `Failed to create product on ${data.gateway}: ${msg}`
      );
    }
  }
);

// ─── Update Product Gateways Config ──────────────────────────────────────────

const updateProductGatewaysSchema = z.object({
  appId: z.string().min(1),
  entitlementId: z.string().min(1),
  productId: z.string().min(1),
  gateways: z.record(
    z.string(),
    z.object({
      gateway: z.string().optional(),
      enabled: z.boolean(),
      externalProductId: z.string().optional(),
      externalPriceId: z.string().optional(),
      checkoutUrl: z.string().optional(),
      conditions: z
        .object({
          currencies: z.array(z.string()).optional(),
          regions: z.array(z.string()).optional()
        })
        .optional(),
      price: z.object({
        amount: z.object({
          value: z.number(),
          currency: z.string(),
          symbol: z.string()
        }),
        intervalCount: z.number().optional(),
        intervalUnit: z.string().optional(),
        trialDays: z.number().optional(),
        displayLabel: z.string().optional()
      }),
      metadata: z.record(z.string(), z.unknown()).optional()
    })
  ),
  secret: z.literal('shambho').optional()
});

export const updateproductgateways = onCall(
  {
    ...deployOptions,
    region: 'asia-south2'
  },
  async (request): Promise<{ success: boolean; productId: string }> => {
    await checkRequest(request, updateProductGatewaysSchema, false);
    assertGlobalAdmin(request);

    const { appId, entitlementId, productId, gateways } =
      updateProductGatewaysSchema.parse(request.data);

    const productRef = db
      .collection('entitlements')
      .doc(entitlementId)
      .collection('products')
      .doc(productId);

    const snap = await productRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }

    const existing = snap.data() as any;
    if (existing?.app?.id !== appId) {
      throw new HttpsError(
        'permission-denied',
        'Product does not belong to app'
      );
    }

    await productRef.set(
      { gateways, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return { success: true, productId };
  }
);
