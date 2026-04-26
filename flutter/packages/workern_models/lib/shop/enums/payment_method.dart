enum PaymentMethod {
  online,
  payOnDelivery;

  String toJson() => name;

  /// Format payment method for display
  String format() {
    switch (this) {
      case PaymentMethod.online:
        return 'Online';
      case PaymentMethod.payOnDelivery:
        return 'Pay on Delivery';
    }
  }

  static PaymentMethod fromJson(String value) {
    switch (value) {
      case 'online':
        return PaymentMethod.online;
      case 'payOnDelivery':
        return PaymentMethod.payOnDelivery;
      default:
        return PaymentMethod.online;
    }
  }

  /// Format payment method string for display (handles null and string inputs)
  static String formatPaymentMethod(String? method) {
    if (method == null) return 'N/A';
    if (method.toLowerCase().contains('delivery')) {
      return 'Pay on Delivery';
    }
    return method;
  }
}
