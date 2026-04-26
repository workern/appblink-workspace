export enum BillingIntervalUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export function getBillingIntervalUnitInMs(
  intervalUnit: BillingIntervalUnit
): number {
  switch (intervalUnit) {
    case BillingIntervalUnit.DAY:
      return 24 * 60 * 60 * 1000; // 1 day in milliseconds
    case BillingIntervalUnit.WEEK:
      return 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
    case BillingIntervalUnit.MONTH:
      return 30 * 24 * 60 * 60 * 1000; // Approx. 1 month in milliseconds
    case BillingIntervalUnit.YEAR:
      return 365 * 24 * 60 * 60 * 1000; // Approx. 1 year in milliseconds
    default:
      throw new Error(`Unsupported billing interval unit: ${intervalUnit}`);
  }
}
