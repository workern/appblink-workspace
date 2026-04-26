enum OrderType {
  instant,
  scheduled,
  periodic;

  String toJson() => name;

  /// Format order type for display
  String format() {
    switch (this) {
      case OrderType.instant:
        return 'Instant Orders';
      case OrderType.scheduled:
        return 'Scheduled Orders';
      case OrderType.periodic:
        return 'Periodic/Subscription';
    }
  }

  static OrderType fromJson(String value) {
    switch (value) {
      case 'instant':
        return OrderType.instant;
      case 'scheduled':
        return OrderType.scheduled;
      case 'periodic':
        return OrderType.periodic;
      default:
        return OrderType.instant;
    }
  }

  /// Format order type string for display (handles null and string inputs)
  static String formatOrderType(String? type) {
    if (type == null) return 'Instant';
    switch (type.toLowerCase()) {
      case 'instant':
        return 'Instant Delivery';
      case 'scheduled':
        return 'Scheduled';
      case 'periodic':
        return 'Subscription';
      default:
        return type;
    }
  }
}
