import '../../amount.dart';
import '../enums/shop_order_type.dart';
import '../enums/shop_payment_method.dart';
import 'working_hours.dart';

/// Shop order settings
class OrderSettings {
  final bool canPlaceOrders;
  final Amount minimumAmount;
  final WorkingHours timings;
  final List<ShopPaymentMethod> paymentMethods;
  final List<ShopOrderType> allowedOrderTypes;

  OrderSettings({
    required this.canPlaceOrders,
    required this.minimumAmount,
    required this.timings,
    required this.paymentMethods,
    required this.allowedOrderTypes,
  });

  factory OrderSettings.fromJson(Map<String, dynamic> json) => OrderSettings(
    canPlaceOrders: json['canPlaceOrders'] ?? true,
    minimumAmount:
        json['minimumAmount'] != null &&
            json['minimumAmount'] is Map<String, dynamic>
        ? Amount.fromJson(json['minimumAmount'])
        : Amount(value: 0, currency: 'INR', symbol: '₹'),
    timings: WorkingHours.fromJson(json['timings'] ?? {}),
    paymentMethods: json['paymentMethods'] != null
        ? (json['paymentMethods'] as List)
              .map((e) => ShopPaymentMethod.fromJson(e as String))
              .toList()
        : [ShopPaymentMethod.online],
    allowedOrderTypes: json['allowedOrderTypes'] != null
        ? (json['allowedOrderTypes'] as List)
              .map((e) => ShopOrderType.fromJson(e as String))
              .toList()
        : [ShopOrderType.instant],
  );

  Map<String, dynamic> toJson() => {
    'canPlaceOrders': canPlaceOrders,
    'minimumAmount': minimumAmount.toJson(),
    'timings': timings.toJson(),
    'paymentMethods': paymentMethods.map((e) => e.toJson()).toList(),
    'allowedOrderTypes': allowedOrderTypes.map((e) => e.toJson()).toList(),
  };
}
