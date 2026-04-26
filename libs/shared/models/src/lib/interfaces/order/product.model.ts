import { Amount } from '../amount';
import { ShopLogoUrls } from '../shop';
import { Verification } from '../verification/verification-data';
import { Rating } from '../rating.model';

/**
 * Product variant for customer-facing display
 * Simplified version of ItemVariant for the Nikat app
 */
export interface VariantOffer {
  /** Optional id referencing a central Offer document */
  id?: string;

  /** Short title shown in UI (e.g. "10% off") */
  title?: string;

  /** Small badge text for compact UI (e.g. "Deal", "10% OFF") */
  badge?: string;

  /** Type of the inline discount (keeps it intentionally small) */
  type?: 'PERCENTAGE' | 'FIXED' | 'FIXED_PRICE';

  /** Percentage value (use when type === 'PERCENTAGE'). Example: 10 for 10%. */
  percentage?: number;

  /** Fixed discount amount (use when type === 'FIXED'). Use your Amount type. */
  fixedAmount?: Amount;

  /** If type === 'FIXED_PRICE', this amount becomes the final price for the variant */
  fixedPrice?: Amount;

  /** Validity window for display/quick eligibility checks (ISO datetime strings) */
  validFrom?: string;
  validUntil?: string;

  /** Priority for multiple inline offers — higher wins when resolving simple conflicts */
  priority?: number;

  /** Whether this inline offer can be combined with other offers (simple flag) */
  combinable?: boolean;

  /** Small free-form metadata if required for UI (e.g. marketing tag) */
  metadata?: Record<string, any>;
}
export interface ProductVariant {
  id: string;
  name: string;
  price: Amount;
  quantity: number;
  available: boolean;
  sku?: string;
  offers?: VariantOffer[];
}

export interface Product {
  id: string;
  name: string;
  shop: { id: string; name: string; category: string; logos?: ShopLogoUrls };
  description: string;
  imageUrls: string[];
  visible: boolean;
  verification?: Verification;
  category?: string;
  rating: Rating;
  available: boolean;
  offerIds?: string[];

  /**
   * Product variants (e.g., sizes, volumes)
   * REQUIRED: Must always contain at least a 'default' variant
   * For single-variant items, use only the 'default' key
   * For multi-variant items, 'default' is the first/primary variant
   * Customer must select a variant before adding to cart
   */
  variants: {
    [variantId: string]: ProductVariant;
  };
  defaultVariantId: string;

  /**
   * Whether this product has multiple variants (more than just 'default')
   * False for single-variant items (only 'default' variant exists)
   * True for multi-variant items ('default' + other variants)
   */
  hasVariants: boolean;
}
