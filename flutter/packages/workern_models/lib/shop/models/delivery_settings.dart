import '../../amount.dart';
import '../enums/delivery_managed_by.dart';
import 'delivery_details.dart';

class DeliverySettings {
  final DeliveryManagedBy managedBy;
  final DeliveryDetails selfDelivery;
  final DeliveryDetails? nikatDelivery;

  DeliverySettings({
    required this.managedBy,
    required this.selfDelivery,
    this.nikatDelivery,
  });

  factory DeliverySettings.fromJson(Map<String, dynamic> json) {
    try {
      return DeliverySettings(
        managedBy: json['managedBy'] != null
            ? DeliveryManagedBy.fromJson(_safeString(json['managedBy']))
            : DeliveryManagedBy.shop,
        selfDelivery:
            json['selfDelivery'] != null &&
                json['selfDelivery'] is Map<String, dynamic>
            ? DeliveryDetails.fromJson(
                json['selfDelivery'] as Map<String, dynamic>,
              )
            : _createDefaultDeliveryDetails(),
        nikatDelivery:
            json['nikatDelivery'] != null &&
                json['nikatDelivery'] is Map<String, dynamic>
            ? DeliveryDetails.fromJson(
                json['nikatDelivery'] as Map<String, dynamic>,
              )
            : null,
      );
    } catch (e) {
      // Return defaults on error
      return DeliverySettings(
        managedBy: DeliveryManagedBy.shop,
        selfDelivery: _createDefaultDeliveryDetails(),
      );
    }
  }

  static String _safeString(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  static DeliveryDetails _createDefaultDeliveryDetails() {
    return DeliveryDetails(
      deliveryChargesPerKm: Amount(value: 0, currency: 'INR', symbol: '₹'),
      mininmumOrderAmountForFreeDelivery: Amount(
        value: 0,
        currency: 'INR',
        symbol: '₹',
      ),
      freeDeliveryUptoKm: 0,
      maxDeliveryUptoKm: 0,
      deliveryTime: 'within_30_min',
    );
  }

  Map<String, dynamic> toJson() => {
    'managedBy': managedBy.toJson(),
    'selfDelivery': selfDelivery.toJson(),
    if (nikatDelivery != null) 'nikatDelivery': nikatDelivery!.toJson(),
  };
}
