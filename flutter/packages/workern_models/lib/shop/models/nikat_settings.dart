import '../../amount.dart';
import '../index.dart';

/// Nikat Settings
class NikatSettings {
  final VisibilityDetails visibility;
  final OrderSettings order;
  final DeliverySettings delivery;
  final TermsAndConditions? termsAndConditions;

  NikatSettings({
    required this.visibility,
    required this.order,
    required this.delivery,
    this.termsAndConditions,
  });

  factory NikatSettings.fromJson(Map<String, dynamic> json) {
    return NikatSettings(
      visibility: json['visibility'] != null
          ? VisibilityDetails.fromJson(json['visibility'])
          : VisibilityDetails(shop: false, products: 'none'),
      order: json['order'] != null
          ? OrderSettings.fromJson(json['order'])
          : OrderSettings(
              canPlaceOrders: false,
              minimumAmount: Amount(value: 5000, currency: 'INR', symbol: '₹'),
              timings: WorkingHours(
                monday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                tuesday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                wednesday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                thursday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                friday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                saturday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
                sunday: DayHours(
                  openTime: '11:00',
                  closeTime: '20:00',
                  closed: false,
                ),
              ),
              paymentMethods: [ShopPaymentMethod.online],
              allowedOrderTypes: [
                ShopOrderType.instant,
                ShopOrderType.scheduled,
                ShopOrderType.periodic,
              ],
            ),
      delivery: json['delivery'] != null
          ? DeliverySettings.fromJson(json['delivery'])
          : DeliverySettings(
              managedBy: DeliveryManagedBy.shop,
              selfDelivery: DeliveryDetails(
                deliveryChargesPerKm: Amount(
                  value: 1000,
                  currency: 'INR',
                  symbol: '₹',
                ),
                freeDeliveryUptoKm: 2,
                maxDeliveryUptoKm: 4,
                deliveryTime: 'within_1_hour',
                mininmumOrderAmountForFreeDelivery: Amount(
                  value: 20000,
                  currency: 'INR',
                  symbol: '₹',
                ),
              ),
            ),
      termsAndConditions: json['termsAndConditions'] != null
          ? TermsAndConditions.fromJson(json['termsAndConditions'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'visibility': visibility.toJson(),
    'order': order.toJson(),
    'delivery': delivery.toJson(),
    if (termsAndConditions != null)
      'termsAndConditions': termsAndConditions!.toJson(),
  };
}
