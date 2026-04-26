import { Item, ItemVariant } from '../interfaces/item.model';
import { Amount } from '../interfaces/amount';

/**
 * Utility functions for working with Item variants
 * All items must have at least a 'default' variant
 */

/**
 * Gets the default variant (always exists)
 */
export function getDefaultVariant(item: Item): ItemVariant {
  return item.variants['default'];
}

/**
 * Gets a specific variant by ID
 */
export function getVariant(
  item: Item,
  variantId: string
): ItemVariant | undefined {
  return item.variants[variantId];
}

/**
 * Gets all variants as an array
 */
export function getAllVariants(item: Item): ItemVariant[] {
  return Object.values(item.variants);
}

/**
 * Calculates total quantity across all variants
 */
export function getTotalQuantity(item: Item): number {
  return getAllVariants(item).reduce(
    (total, variant) => total + variant.quantity,
    0
  );
}

/**
 * Calculates total sellable quantity across all variants
 */
export function getTotalSellableQuantity(item: Item): number {
  return getAllVariants(item).reduce(
    (total, variant) => total + variant.sellableQuantity,
    0
  );
}

/**
 * Gets latest MRP from default variant
 */
export function getLatestMRP(item: Item): Amount {
  return item.variants['default'].mrps.latest;
}

/**
 * Gets latest rate from default variant
 */
export function getLatestRate(item: Item): Amount {
  return item.variants['default'].rates.latest;
}

/**
 * Gets closest expiry date across all variants
 */
export function getClosestExpiryDate(item: Item): Date {
  const variants = getAllVariants(item);
  let closest = variants[0].expiryDates.closest;

  for (const variant of variants) {
    const expiryDate = variant.expiryDates.closest;
    if (expiryDate < closest) {
      closest = expiryDate;
    }
  }

  return closest;
}

/**
 * Calculates total spent across all variants
 */
export function getTotalSpent(item: Item): Amount {
  const variants = getAllVariants(item);
  const total = variants.reduce(
    (sum, variant) => sum + variant.totalSpent.value,
    0
  );
  return {
    value: total,
    currency: variants[0].totalSpent.currency,
    symbol: variants[0].totalSpent.symbol
  };
}

/**
 * Calculates total revenue across all variants
 */
export function getTotalRevenue(item: Item): Amount {
  const variants = getAllVariants(item);
  const total = variants.reduce(
    (sum, variant) => sum + variant.totalRevenue.value,
    0
  );
  return {
    value: total,
    currency: variants[0].totalRevenue.currency,
    symbol: variants[0].totalRevenue.symbol
  };
}

/**
 * Checks if an item is in stock (any variant has quantity > 0)
 */
export function isInStock(item: Item): boolean {
  return getTotalQuantity(item) > 0;
}

/**
 * Gets available variants (variants with quantity > 0)
 */
export function getAvailableVariants(item: Item): ItemVariant[] {
  return getAllVariants(item).filter(
    (variant) => variant.quantity > 0 && variant.available
  );
}

/**
 * Gets variant IDs sorted by sort order
 */
export function getSortedVariantIds(item: Item): string[] {
  return Object.entries(item.variants || {})
    .sort(([, a], [, b]) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(([id]) => id);
}

/**
 * Creates a new empty variant
 */
export function createEmptyVariant(
  id: string,
  name: string,
  sortOrder = 0
): ItemVariant {
  return {
    id,
    name,
    quantity: 0,
    sellableQuantityPerUnit: 1,
    sellableQuantity: 0,
    mrps: {
      latest: { value: 0, currency: 'INR', symbol: '₹' },
      lowest: { value: 0, currency: 'INR', symbol: '₹' },
      highest: { value: 0, currency: 'INR', symbol: '₹' },
      oldest: { value: 0, currency: 'INR', symbol: '₹' },
      avg: { value: 0, currency: 'INR', symbol: '₹' }
    },
    rates: {
      latest: { value: 0, currency: 'INR', symbol: '₹' },
      lowest: { value: 0, currency: 'INR', symbol: '₹' },
      highest: { value: 0, currency: 'INR', symbol: '₹' },
      oldest: { value: 0, currency: 'INR', symbol: '₹' },
      avg: { value: 0, currency: 'INR', symbol: '₹' }
    },
    expiryDates: {
      closest: new Date(),
      all: [],
      farthest: new Date()
    },
    batchCodes: [],
    totalSpent: { value: 0, currency: 'INR', symbol: '₹' },
    totalRevenue: { value: 0, currency: 'INR', symbol: '₹' },
    available: true,
    sortOrder
  };
}
