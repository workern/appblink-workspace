enum DeliveryManagedBy {
  shop,
  nikat,
  none,
  pickUp;

  String toJson() {
    switch (this) {
      case DeliveryManagedBy.shop:
        return 'shop';
      case DeliveryManagedBy.nikat:
        return 'nikat';
      case DeliveryManagedBy.none:
        return 'none';
      case DeliveryManagedBy.pickUp:
        return 'pick-up';
    }
  }

  static DeliveryManagedBy fromJson(String value) {
    switch (value) {
      case 'shop':
        return DeliveryManagedBy.shop;
      case 'nikat':
        return DeliveryManagedBy.nikat;
      case 'none':
        return DeliveryManagedBy.none;
      case 'pick-up':
        return DeliveryManagedBy.pickUp;
      default:
        return DeliveryManagedBy.shop;
    }
  }
}
