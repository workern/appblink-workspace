import { Base } from './base.model';
import { Amount } from './amount';
import { ShopOwnerRecord } from './shop';
import { Verification } from './verification/verification-data';
import { Rating } from './rating.model';

/**
 * Represents a product variant (e.g., size, volume, color)
 * Professional e-commerce structure for managing different SKUs of the same item
 */
export interface ItemVariant {
  /** Unique identifier for this variant (e.g., 'small', 'medium', 'large', '20ml', '50ml', 'default') */
  id: string;

  /** Display name for the variant (e.g., 'Small', 'Medium', 'Large', '20ml', '50ml') */
  name: string;

  /** Available quantity for this specific variant */
  quantity: number;
  available: boolean;
  /** Sellable quantity per unit (e.g., 10 tablets per strip) */
  sellableQuantityPerUnit: number;

  /** Total sellable quantity (quantity * sellableQuantityPerUnit) */
  sellableQuantity: number;

  /** Current pricing information for this variant */
  mrps: {
    latest: Amount;
    lowest: Amount;
    highest: Amount;
    oldest: Amount;
    avg: Amount;
  };

  /** Purchase/cost rates for this variant */
  rates: {
    latest: Amount;
    lowest: Amount;
    highest: Amount;
    oldest: Amount;
    avg: Amount;
  };

  /** Expiry date tracking for this variant */
  expiryDates: {
    closest: Date;
    all: Date[];
    farthest: Date;
  };

  /** Batch codes associated with this variant */
  batchCodes: string[];

  /** Total amount spent on purchasing this variant */
  totalSpent: Amount;

  /** Total revenue generated from this variant */
  totalRevenue: Amount;

  /** Whether this variant is currently available for sale */

  /** Sort order for displaying variants */
  sortOrder?: number;

  /** SKU (Stock Keeping Unit) identifier */
  sku?: string;

  /** Barcode/UPC for this variant */
  barcode?: string;

  /** Weight of this variant (if applicable) */
  weight?: {
    value: number;
    unit: 'g' | 'kg' | 'mg' | 'lb' | 'oz';
  };

  /** Dimensions of this variant (if applicable) */
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'm' | 'in' | 'ft';
  };
}

export interface Item<T = Date> extends Base<T> {
  name: string;
  description: string;
  shop: Pick<ShopOwnerRecord, 'id' | 'category' | 'name' | 'logos'>;
  rating: Rating;

  /**
   * Variants of this item (e.g., different sizes, volumes)
   * REQUIRED: Must always contain at least a 'default' variant
   * For single-variant items, use only the 'default' key
   * For multi-variant items, 'default' is the first/primary variant
   * Key: variant ID, Value: variant details
   */
  variants: {
    [variantId: string]: ItemVariant;
  };
  defaultVariantId: string;
  available: boolean;
  /**
   * Whether this item has multiple variants (more than just 'default')
   * False for single-variant items (only 'default' variant exists)
   * True for multi-variant items ('default' + other variants)
   */
  hasVariants: boolean;

  imageUrls: string[];
  nikat: {
    visible: boolean;
    verification: Verification;
  };
  /** Total amount spent on purchasing this variant */
  totalSpent: Amount;

  /** Total revenue generated from this variant */
  totalRevenue: Amount;
  supplierIds: string[];
}
