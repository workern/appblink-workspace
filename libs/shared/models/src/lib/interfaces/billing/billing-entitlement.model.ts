import { APPID } from '../../enums';
import { Base } from '../base.model';

/**
 * Top-level entitlement document at: entitlements/{entitlementId}
 *
 * Defines WHAT access a user gets (e.g., "pro", "premium").
 * Products (HOW they pay) live as a subcollection:
 *   entitlements/{entitlementId}/products/{productId}
 *
 * User access is checked via:
 *   userClaims/{uid}.{appId}.entitlements.{entitlementId} = true
 */
export interface BillingEntitlement<T = Date> extends Base<T> {
  /** The app this entitlement belongs to */
  appId: APPID;
  /** Human-readable name, e.g. "Pro Plan" */
  name: string;
  /** Feature bullets shown in pricing / paywall UI */
  features?: string[];
  metadata?: Record<string, unknown>;
}
