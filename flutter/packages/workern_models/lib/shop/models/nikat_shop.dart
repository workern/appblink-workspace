import 'package:cloud_firestore/cloud_firestore.dart';
import '../../verification.dart';
import 'shop_logos.dart';
import '../enums/delivery_managed_by.dart';
import '../enums/shop_order_type.dart';
import 'delivery_details.dart';
import 'delivery_settings.dart';
import 'day_hours.dart';
import 'offer.dart';
import 'order_settings.dart';
import '../../google_place_address.dart';
import 'shop_status_result.dart';
import 'terms_and_conditions.dart';
import 'visibility_details.dart';
import '../../verification_status.dart';
import '../../rating/rating.dart';

class NikatShop {
  final String id;
  final String name;
  final String category;
  final GooglePlaceAddress address;
  final Rating rating;
  final double popularity;
  final ShopLogos logos;
  final DeliverySettings delivery;
  final OrderSettings order;
  final TermsAndConditions termsAndConditions;
  final VisibilityDetails visibility;
  final Verification verification;
  final String? contactNumber;
  final List<Offer>? offers;
  final double? distance;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  NikatShop({
    required this.id,
    required this.name,
    required this.category,
    required this.address,
    required this.rating,
    required this.popularity,
    required this.logos,
    required this.delivery,
    required this.order,
    required this.termsAndConditions,
    required this.visibility,
    required this.verification,
    this.contactNumber,
    this.offers,
    this.distance,
    this.createdAt,
    this.updatedAt,
  });

  factory NikatShop.fromJson(Map<String, dynamic> json) => NikatShop(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    category: json['category'] ?? '',
    address: GooglePlaceAddress.fromJson(json['address'] ?? {}),
    rating: json['rating'] is Map<String, dynamic>
        ? Rating.fromJson(json['rating'])
        : Rating.empty(), // For backward compatibility
    popularity: (json['popularity'] as num?)?.toDouble() ?? 0,
    logos: ShopLogos.fromJson(json['logos'] ?? {}),
    delivery: DeliverySettings.fromJson(json['delivery'] ?? {}),
    order: OrderSettings.fromJson(json['order'] ?? {}),
    termsAndConditions: TermsAndConditions.fromJson(
      json['termsAndConditions'] ?? {},
    ),
    visibility: VisibilityDetails.fromJson(json['visibility'] ?? {}),
    verification: Verification.fromJson(json['verification'] ?? {}),
    contactNumber: json['contactNumber'] as String?,
    offers: json['offers'] != null
        ? (json['offers'] as List).map((o) => Offer.fromJson(o)).toList()
        : null,
    distance: (json['distance'] as num?)?.toDouble(),
    createdAt: (json['createdAt'] as Timestamp?)?.toDate(),
    updatedAt: (json['updatedAt'] as Timestamp?)?.toDate(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'category': category,
    'address': address.toJson(),
    'rating': rating.toJson(),
    'popularity': popularity,
    'logos': logos.toJson(),
    'delivery': delivery.toJson(),
    'order': order.toJson(),
    'termsAndConditions': termsAndConditions.toJson(),
    'visibility': visibility.toJson(),
    'verification': verification.toJson(),
    if (contactNumber != null) 'contactNumber': contactNumber,
    if (offers != null) 'offers': offers!.map((o) => o.toJson()).toList(),
    if (distance != null) 'distance': distance,
    if (createdAt != null) 'createdAt': Timestamp.fromDate(createdAt!),
    if (updatedAt != null) 'updatedAt': Timestamp.fromDate(updatedAt!),
  };

  bool get isOpen => order.canPlaceOrders;

  bool get isVerified => verification.status == VerificationStatus.verified;

  String get deliveryTimeText {
    // Determine which delivery details to use based on managedBy
    final DeliveryDetails? deliveryDetails;
    switch (delivery.managedBy) {
      case DeliveryManagedBy.shop:
        deliveryDetails = delivery.selfDelivery;
        break;
      case DeliveryManagedBy.nikat:
        deliveryDetails = delivery.nikatDelivery ?? delivery.selfDelivery;
        break;
      case DeliveryManagedBy.none:
      case DeliveryManagedBy.pickUp:
        return 'Pick up only';
    }

    final deliveryTime = deliveryDetails.deliveryTime;

    switch (deliveryTime) {
      case 'within_30_min':
        return 'Within 30 minutes';
      case 'within_1_hour':
        return 'Within 1 hour';
      case 'within_3_hours':
        return 'Within 3 hours';
      case 'by_end_of_day':
        return 'By end of day';
      default:
        return '25-30 mins';
    }
  }

  String get termsAndConditionsText {
    final returnText = termsAndConditions.returns.notAllowed
        ? 'No Returns'
        : 'Returns within ${termsAndConditions.returns.days} days';
    final exchangeText = termsAndConditions.exchange.notAllowed
        ? 'No Exchanges'
        : 'Exchanges within ${termsAndConditions.exchange.days} days';

    return '$returnText • $exchangeText';
  }

  bool get acceptingInstantOrders {
    final status = getStatus();
    return status.acceptingOrders;
  }

  bool get acceptingScheduledOrders {
    final status = getStatus();
    return status.canSchedule;
  }

  /// Determines the current operational status of the shop
  ShopStatusResult getStatus() {
    final canSchedule = order.allowedOrderTypes.contains(
      ShopOrderType.scheduled,
    );
    if (!order.canPlaceOrders) {
      return ShopStatusResult(
        acceptingOrders: false,
        canSchedule: canSchedule,
        status: 'closed_unavailable',
        message: 'Not accepting new orders currently',
      );
    }

    final now = DateTime.now();

    // Map day index to day name (weekday: 1=Monday, 7=Sunday)
    final dayNames = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    final dayName = dayNames[now.weekday - 1];

    // Get today's working hours based on day name
    DayHours todaysHours;
    switch (dayName) {
      case 'monday':
        todaysHours = order.timings.monday;
        break;
      case 'tuesday':
        todaysHours = order.timings.tuesday;
        break;
      case 'wednesday':
        todaysHours = order.timings.wednesday;
        break;
      case 'thursday':
        todaysHours = order.timings.thursday;
        break;
      case 'friday':
        todaysHours = order.timings.friday;
        break;
      case 'saturday':
        todaysHours = order.timings.saturday;
        break;
      case 'sunday':
        todaysHours = order.timings.sunday;
        break;
      default:
        todaysHours = order.timings.monday;
    }

    // Check if shop is closed for the entire day
    if (todaysHours.closed ||
        todaysHours.openTime.isEmpty ||
        todaysHours.closeTime.isEmpty) {
      final scheduleMessage = canSchedule
          ? ' You can place a scheduled order for the next opening day.'
          : '';
      return ShopStatusResult(
        canSchedule: canSchedule,
        acceptingOrders: false,
        status: canSchedule ? 'closed_can_schedule' : 'closed_unavailable',
        message: 'Closed today.$scheduleMessage',
      );
    }

    // Get current time in HH:mm format
    final currentTime =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    // Check if shop is open
    final isOpen =
        currentTime.compareTo(todaysHours.openTime) >= 0 &&
        currentTime.compareTo(todaysHours.closeTime) < 0;

    if (isOpen) {
      return ShopStatusResult(
        canSchedule: canSchedule,
        acceptingOrders: true,
        status: 'open',
        message: 'Open • Closes at ${todaysHours.closeTime}',
      );
    } else {
      // Check if scheduling is allowed
      final canSchedule = order.allowedOrderTypes.contains(
        ShopOrderType.scheduled,
      );
      final scheduleMessage = canSchedule
          ? ' You can place a scheduled order.'
          : '';

      // Determine if shop opens later today or tomorrow
      final message = currentTime.compareTo(todaysHours.openTime) < 0
          ? 'Closed • Opens at ${todaysHours.openTime}.$scheduleMessage'
          : 'Closed • Opens tomorrow.$scheduleMessage';

      return ShopStatusResult(
        acceptingOrders: false,
        canSchedule: canSchedule,
        status: canSchedule ? 'closed_can_schedule' : 'closed_unavailable',
        message: message,
      );
    }
  }
}
