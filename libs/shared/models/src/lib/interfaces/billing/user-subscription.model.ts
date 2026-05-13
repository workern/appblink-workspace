import { Amount } from '../common';

export type SubscriptionStatus =
  | 'created' // enrollment created, mandate not yet set up
  | 'authenticated' // mandate authorised, first charge pending
  | 'active' // currently billing normally
  | 'pending' // charge is being retried / queued
  | 'halted' // all retries exhausted – access revoked
  | 'paused' // manually paused via API
  | 'cancelled' // cancelled by user or merchant
  | 'completed' // all billing cycles exhausted
  | 'expired';

/** Lightweight product snapshot stored inside the subscription doc. */
export interface SubscriptionProductSnapshot {
  id: string;
  name: string;
  description?: string;
  features?: string[];
}

/**
 * Stored at: users/{uid}/mySpaces/{appId}/subscriptions/{productId}
 *
 * Keyed by productId so there is exactly one doc per product per user.
 * Re-subscriptions update the same document in-place; the frontend can fetch
 * it directly without a collection query.
 *
 * Maintained by webhook handlers so the frontend always has a single,
 * consistent document to build the billing UI from – no need to read the
 * transaction doc or userClaims.
 */
export interface UserSubscription<T = Date> {
  /** Same as productId – used as the Firestore doc ID. */
  id: string;
  appId: string;
  /** Transaction ID of the initial enrollment charge. */
  enrollmentTransactionId?: string;
  /** Denormalized product snapshot for display (name, description, features). */
  product?: SubscriptionProductSnapshot;
  /** Razorpay subscription ID (sub_XXXX). */
  subscriptionId: string;
  /** Razorpay plan ID (plan_XXXX). */
  planId: string;
  status: SubscriptionStatus;
  /** Per-cycle charge amount. */
  amount: Amount;
  /** Start of the current billing period. Null until first charge. */
  currentPeriodStart: T | null;
  /** End of the current billing period – the "next renewal date" shown in UI. */
  currentPeriodEnd: T | null;
  /** Exact timestamp of the next scheduled charge. */
  nextChargeAt: T | null;
  /** Number of billing cycles successfully paid. */
  paidCount: number;
  /** Total planned billing cycles (e.g. 120 for a monthly-billed annual plan). */
  totalCount: number;
  /** Remaining cycles. */
  remainingCount: number;
  /**
   * True once the user has requested cancellation-at-cycle-end.
   * The subscription stays active until currentPeriodEnd, then is cancelled.
   */
  cancelAtCycleEnd?: boolean;
  createdAt: T;
  updatedAt: T;
}
