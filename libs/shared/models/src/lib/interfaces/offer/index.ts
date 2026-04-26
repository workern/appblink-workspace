import { Amount } from '../amount';

// Where an offer applies
export type OfferScopeType =
  | 'PRODUCT'
  | 'VARIANT'
  | 'SHOP'
  | 'CART'
  | 'CATEGORY'
  | 'GLOBAL';

// Discount action types
export type OfferActionType =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'FIXED_PRICE'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING'
  | 'MULTI_BUY_N_FOR_M';

// How the offer is delivered: automatic or by code
export type OfferDelivery = 'AUTOMATIC' | 'COUPON_CODE';

// Where to store/generate promo codes
export type CouponMode = 'SINGLE_USE' | 'MULTI_USE' | 'UNLIMITED';

// Core Offer model (store as document in offers collection)
export interface Offer {
  id: string;
  name: string; // friendly internal name
  title?: string; // short public title (for UI)
  description?: string; // long description shown in UI or emails
  code?: string; // if delivery === 'COUPON_CODE'
  delivery: OfferDelivery; // automatic or coupon
  couponMode?: CouponMode; // required when delivery === 'COUPON_CODE'
  scope: OfferScope; // where this offer can apply
  conditions?: OfferCondition[]; // list of AND conditions (all must pass) - see below
  action: OfferAction; // what the offer does
  combinableWith?: string[]; // tags or offer ids that it can be combined with
  stackMode?: 'STACKABLE' | 'NON_STACKABLE' | 'PRIORITY_OVERRIDE'; // stacking semantics
  priority?: number; // higher => applied earlier (or see business rule)
  maxRedemptions?: number; // global cap for the offer
  perUserLimit?: number; // cap per user
  usageCount?: number; // server-updated counter (for reporting)
  maxDiscountAmount?: Amount; // cap on discount amount (helps with % discounts)
  validFrom?: string; // ISO datetime e.g. "2025-12-09T00:00:00Z"
  validUntil?: string; // ISO datetime
  timezone?: string; // optional timezone for validity (if needed)
  active: boolean;
  tags?: string[]; // e.g. ['first_order', 'festive']
  metadata?: Record<string, any>; // free-form for marketing analytics
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/** Scope definition: where the offer applies */
export interface OfferScope {
  type: OfferScopeType;
  shopId?: string;
  productIds?: string[]; // product-level
  variantIds?: string[]; // variant-level
  categoryIds?: string[]; // category-level
}

/** Conditions that must be satisfied to apply the offer.
 * Conditions are treated as AND by default. You can implement OR groups in your rules engine if needed.
 */
export type OfferCondition =
  | {
      type: 'MIN_CART_VALUE';
      minAmount: Amount;
    }
  | {
      type: 'MIN_QUANTITY';
      productId?: string; // optional: min quantity of a specific product
      variantId?: string;
      minQuantity: number;
    }
  | {
      type: 'FIRST_ORDER';
      onlyIfFirstOrder: true;
    }
  | {
      type: 'CUSTOMER_SEGMENT';
      segmentId: string; // e.g., 'vip', 'student', 'email_verified'
    }
  | {
      type: 'DATE_RANGE';
      from: string;
      to: string;
    }
  | {
      type: 'APPLY_ONCE_PER_ORDER';
      once: true;
    };

/** Action defines how price / items change */
export type OfferAction =
  | {
      type: 'PERCENTAGE';
      percentage: number; // 10 for 10%
      applyToShipping?: boolean;
    }
  | {
      type: 'FIXED';
      amount: Amount; // subtract this fixed amount
    }
  | {
      type: 'FIXED_PRICE';
      amount: Amount; // set final price to this (useful for clearances)
    }
  | {
      type: 'BUY_X_GET_Y';
      buyProductId?: string; // if absent, assumes same product
      buyVariantId?: string;
      buyQuantity: number; // X
      getProductId?: string; // Y product/variant can be same
      getVariantId?: string;
      getQuantity: number; // Y
      free?: boolean; // true => free, false => discounted
      discountOnGet?: { type: 'PERCENTAGE' | 'FIXED'; value: number | Amount };
      maxFreePerOrder?: number;
    }
  | {
      type: 'MULTI_BUY_N_FOR_M';
      productId?: string;
      variantId?: string;
      n: number; // buy n
      m: number; // pay m
    }
  | {
      type: 'FREE_SHIPPING';
      minCartValue?: Amount;
    };

/** Audit / Redemption record */
export interface OfferRedemption {
  id: string;
  offerId: string;
  userId?: string;
  orderId?: string;
  amountSaved?: Amount;
  redeemedAt: string;
  meta?: Record<string, any>;
}
