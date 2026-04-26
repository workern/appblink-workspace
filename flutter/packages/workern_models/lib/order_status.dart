enum OrderStatus {
  processing('PROCESSING'),
  acceptedByShop('ACCEPTED_BY_SHOP'),
  completed('COMPLETED'),
  cancelled('CANCELLED'),
  scheduled('SCHEDULED'),
  pendingPayment('PENDING_PAYMENT');

  final String value;

  const OrderStatus(this.value);

  /// Parse a string to OrderStatus enum
  static OrderStatus? fromString(String? status) {
    if (status == null) return null;
    try {
      return OrderStatus.values.firstWhere((e) => e.value == status);
    } catch (e) {
      return null;
    }
  }

  /// Check if this status indicates payment success
  bool get isSuccess =>
      this == OrderStatus.processing ||
      this == OrderStatus.acceptedByShop ||
      this == OrderStatus.completed;

  /// Check if this status indicates payment failure
  bool get isFailure => this == OrderStatus.cancelled;
}
