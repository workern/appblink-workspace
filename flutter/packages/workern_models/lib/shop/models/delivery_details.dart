import '../../amount.dart';

class DeliveryDetails {
  final Amount deliveryChargesPerKm;
  final Amount mininmumOrderAmountForFreeDelivery;
  final double freeDeliveryUptoKm;
  final double maxDeliveryUptoKm;
  final String
  deliveryTime; // 'within_30_min', 'within_1_hour', 'within_3_hours', 'by_end_of_day'

  DeliveryDetails({
    required this.deliveryChargesPerKm,
    required this.mininmumOrderAmountForFreeDelivery,
    required this.freeDeliveryUptoKm,
    required this.maxDeliveryUptoKm,
    required this.deliveryTime,
  });

  factory DeliveryDetails.fromJson(Map<String, dynamic> json) =>
      DeliveryDetails(
        deliveryChargesPerKm: json['deliveryChargesPerKm'] != null
            ? (json['deliveryChargesPerKm'] is int
                  ? Amount(
                      value: json['deliveryChargesPerKm'],
                      currency: 'INR',
                      symbol: '₹',
                    )
                  : Amount.fromJson(json['deliveryChargesPerKm']))
            : Amount(value: 0, currency: 'INR', symbol: '₹'),
        mininmumOrderAmountForFreeDelivery:
            json['mininmumOrderAmountForFreeDelivery'] != null
            ? (json['mininmumOrderAmountForFreeDelivery'] is int
                  ? Amount(
                      value: json['mininmumOrderAmountForFreeDelivery'],
                      currency: 'INR',
                      symbol: '₹',
                    )
                  : Amount.fromJson(json['mininmumOrderAmountForFreeDelivery']))
            : Amount(value: 0, currency: 'INR', symbol: '₹'),
        freeDeliveryUptoKm:
            (json['freeDeliveryUptoKm'] as num?)?.toDouble() ?? 0,
        maxDeliveryUptoKm: (json['maxDeliveryUptoKm'] as num?)?.toDouble() ?? 0,
        deliveryTime: json['deliveryTime'] as String? ?? 'within_30_min',
      );

  Map<String, dynamic> toJson() => {
    'deliveryChargesPerKm': deliveryChargesPerKm.toJson(),
    'mininmumOrderAmountForFreeDelivery': mininmumOrderAmountForFreeDelivery
        .toJson(),
    'freeDeliveryUptoKm': freeDeliveryUptoKm,
    'maxDeliveryUptoKm': maxDeliveryUptoKm,
    'deliveryTime': deliveryTime,
  };
}
