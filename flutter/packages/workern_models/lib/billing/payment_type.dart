enum PaymentType { oneTime, subscription }

extension PaymentTypeX on PaymentType {
  String get value {
    switch (this) {
      case PaymentType.oneTime:
        return 'ONE_TIME';
      case PaymentType.subscription:
        return 'SUBSCRIPTION';
    }
  }

  static PaymentType fromValue(String value) {
    return PaymentType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => PaymentType.oneTime,
    );
  }
}
