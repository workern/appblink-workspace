enum BillingIntervalUnit { day, week, month, year }

extension BillingIntervalUnitX on BillingIntervalUnit {
  String get value {
    switch (this) {
      case BillingIntervalUnit.day:
        return 'DAY';
      case BillingIntervalUnit.week:
        return 'WEEK';
      case BillingIntervalUnit.month:
        return 'MONTH';
      case BillingIntervalUnit.year:
        return 'YEAR';
    }
  }

  static BillingIntervalUnit fromValue(String value) {
    return BillingIntervalUnit.values.firstWhere(
      (unit) => unit.value == value,
      orElse: () => BillingIntervalUnit.month,
    );
  }
}
