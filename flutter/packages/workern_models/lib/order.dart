import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/shop/models/nikat_shop.dart';
import 'package:workern_utils/workern_utils.dart';
import 'amount.dart';
import 'product.dart';
import 'user.dart';
import 'shop/models/shop_logos.dart';
import 'shop/enums/delivery_managed_by.dart';
import 'shop/enums/payment_method.dart';
import 'shop/enums/order_type.dart';
import 'shop/enums/shop_order_type.dart';
import 'rating/rating.dart';

/// Delivery status enum
enum DeliveryStatus {
  UNASSIGNED,
  ASSIGNED,
  OUT_FOR_DELIVERY,
  DELIVERED,
  FAILED,
  CANCELLED,
  SEARCHING,
}

/// Vehicle information
class VehicleInfo {
  final String? type;
  final String? regNo;

  VehicleInfo({this.type, this.regNo});

  factory VehicleInfo.fromJson(Map<String, dynamic> json) {
    return VehicleInfo(type: json['type'], regNo: json['regNo']);
  }

  Map<String, dynamic> toJson() {
    return {if (type != null) 'type': type, if (regNo != null) 'regNo': regNo};
  }
}

/// Delivery person information for order fulfillment
class OrderDeliveryPerson {
  final String uid;
  final String name;
  final String mobile;
  final VehicleInfo? vehicle;

  OrderDeliveryPerson({
    required this.uid,
    required this.name,
    required this.mobile,
    this.vehicle,
  });

  factory OrderDeliveryPerson.fromJson(Map<String, dynamic> json) {
    return OrderDeliveryPerson(
      uid: json['uid'] ?? '',
      name: json['name'] ?? '',
      mobile: json['mobile'] ?? '',
      vehicle: json['vehicle'] != null
          ? VehicleInfo.fromJson(json['vehicle'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'name': name,
      'mobile': mobile,
      if (vehicle != null) 'vehicle': vehicle!.toJson(),
    };
  }
}

/// Proof of delivery
class ProofOfDelivery {
  final String type; // 'PHOTO', 'SIGNATURE', 'NONE'
  final String? url;

  ProofOfDelivery({required this.type, this.url});

  factory ProofOfDelivery.fromJson(Map<String, dynamic> json) {
    return ProofOfDelivery(type: json['type'] ?? 'NONE', url: json['url']);
  }

  Map<String, dynamic> toJson() {
    return {'type': type, if (url != null) 'url': url};
  }
}

/// Last known location
class LastKnownLocation {
  final double lat;
  final double lng;
  final double? accuracyMeters;
  final String? recordedAt;

  LastKnownLocation({
    required this.lat,
    required this.lng,
    this.accuracyMeters,
    this.recordedAt,
  });

  factory LastKnownLocation.fromJson(Map<String, dynamic> json) {
    return LastKnownLocation(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      accuracyMeters: (json['accuracyMeters'] as num?)?.toDouble(),
      recordedAt: json['recordedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
      if (accuracyMeters != null) 'accuracyMeters': accuracyMeters,
      if (recordedAt != null) 'recordedAt': recordedAt,
    };
  }
}

/// Subscription details for recurring orders
class SubscriptionDetails {
  final String frequency; // 'daily', 'weekly', 'monthly', 'quarterly'
  final String? dayOfWeek; // for weekly
  final int? dateOfMonth; // for monthly

  SubscriptionDetails({
    required this.frequency,
    this.dayOfWeek,
    this.dateOfMonth,
  });

  factory SubscriptionDetails.fromJson(Map<String, dynamic> json) {
    return SubscriptionDetails(
      frequency: json['frequency'] ?? 'weekly',
      dayOfWeek: json['dayOfWeek'],
      dateOfMonth: json['dateOfMonth'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'frequency': frequency,
      if (dayOfWeek != null) 'dayOfWeek': dayOfWeek,
      if (dateOfMonth != null) 'dateOfMonth': dateOfMonth,
    };
  }
}

/// Shop summary in order
class OrderShop {
  final String id;
  final String name;
  final String category;
  final ShopLogos? logos;

  OrderShop({
    required this.id,
    required this.name,
    required this.category,
    this.logos,
  });

  factory OrderShop.fromJson(Map<String, dynamic> json) {
    return OrderShop(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      logos: json['logos'] != null ? ShopLogos.fromJson(json['logos']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      if (logos != null) 'logos': logos!.toJson(),
    };
  }
}

/// Order fees breakdown
class OrderFees {
  final Amount platform;
  final Amount delivery;

  OrderFees({required this.platform, required this.delivery});

  factory OrderFees.fromJson(Map<String, dynamic> json) {
    return OrderFees(
      platform: json['platform'] is Map<String, dynamic>
          ? Amount.fromJson(json['platform'])
          : Amount(
              value: (json['platform'] as num?)?.toDouble() ?? 0,
              currency: 'INR',
              symbol: '₹',
            ),
      delivery: json['delivery'] is Map<String, dynamic>
          ? Amount.fromJson(json['delivery'])
          : Amount(
              value: (json['delivery'] as num?)?.toDouble() ?? 0,
              currency: 'INR',
              symbol: '₹',
            ),
    );
  }

  Map<String, dynamic> toJson() {
    return {'platform': platform.toJson(), 'delivery': delivery.toJson()};
  }

  Amount get total => Amount(
    value: platform.value + delivery.value,
    currency: platform.currency,
    symbol: platform.symbol,
  );
}

/// Order fulfillment details
class OrderFulfillment {
  final DeliveryManagedBy managedBy;
  final DeliveryStatus status;
  final OrderDeliveryPerson? deliveryPerson;
  final DateTime? expectedDeliveryBy;
  final DateTime? assignedAt;
  final DateTime? updatedAt;
  final DateTime? deliveredAt;
  final DateTime? lastUpdatedLocationAt;
  final String? otpForDelivery;
  final ProofOfDelivery? proofOfDelivery;
  final String? trackingUrl;
  final int? attempts;
  final String? failureReason;
  final String? customerNotes;
  final LastKnownLocation? lastKnownLocation;

  OrderFulfillment({
    required this.managedBy,
    required this.status,
    this.deliveryPerson,
    this.expectedDeliveryBy,
    this.assignedAt,
    this.updatedAt,
    this.deliveredAt,
    this.lastUpdatedLocationAt,
    this.otpForDelivery,
    this.proofOfDelivery,
    this.trackingUrl,
    this.attempts,
    this.failureReason,
    this.customerNotes,
    this.lastKnownLocation,
  });

  factory OrderFulfillment.fromJson(Map<String, dynamic> json) {
    // Parse managedBy
    DeliveryManagedBy managedBy = DeliveryManagedBy.shop;
    if (json['managedBy'] != null) {
      managedBy = DeliveryManagedBy.fromJson(json['managedBy']);
    }

    // Parse status
    DeliveryStatus status = DeliveryStatus.UNASSIGNED;
    if (json['status'] != null) {
      final statusStr = json['status'].toString().toUpperCase();
      status = DeliveryStatus.values.firstWhere(
        (e) => e.name == statusStr,
        orElse: () => DeliveryStatus.UNASSIGNED,
      );
    }

    return OrderFulfillment(
      managedBy: managedBy,
      status: status,
      deliveryPerson: json['deliveryPerson'] != null
          ? OrderDeliveryPerson.fromJson(json['deliveryPerson'])
          : null,
      expectedDeliveryBy: _parseDateTime(json['expectedDeliveryBy']),
      assignedAt: _parseDateTime(json['assignedAt']),
      updatedAt: _parseDateTime(json['updatedAt']),
      deliveredAt: _parseDateTime(json['deliveredAt']),
      lastUpdatedLocationAt: _parseDateTime(json['lastUpdatedLocationAt']),
      otpForDelivery: json['otpForDelivery'],
      proofOfDelivery: json['proofOfDelivery'] != null
          ? ProofOfDelivery.fromJson(json['proofOfDelivery'])
          : null,
      trackingUrl: json['trackingUrl'],
      attempts: json['attempts'],
      failureReason: json['failureReason'],
      customerNotes: json['customerNotes'],
      lastKnownLocation: json['lastKnownLocation'] != null
          ? LastKnownLocation.fromJson(json['lastKnownLocation'])
          : null,
    );
  }

  /// Helper method to parse DateTime from various formats
  static DateTime? _parseDateTime(dynamic value) {
    return parseTimestamp(value);
  }

  Map<String, dynamic> toJson() {
    return {
      'managedBy': managedBy.toJson(),
      'status': status.name,
      if (deliveryPerson != null) 'deliveryPerson': deliveryPerson!.toJson(),
      if (expectedDeliveryBy != null)
        'expectedDeliveryBy': Timestamp.fromDate(expectedDeliveryBy!),
      if (assignedAt != null) 'assignedAt': Timestamp.fromDate(assignedAt!),
      if (updatedAt != null) 'updatedAt': Timestamp.fromDate(updatedAt!),
      if (deliveredAt != null) 'deliveredAt': Timestamp.fromDate(deliveredAt!),
      if (lastUpdatedLocationAt != null)
        'lastUpdatedLocationAt': Timestamp.fromDate(lastUpdatedLocationAt!),
      if (otpForDelivery != null) 'otpForDelivery': otpForDelivery,
      if (proofOfDelivery != null) 'proofOfDelivery': proofOfDelivery!.toJson(),
      if (trackingUrl != null) 'trackingUrl': trackingUrl,
      if (attempts != null) 'attempts': attempts,
      if (failureReason != null) 'failureReason': failureReason,
      if (customerNotes != null) 'customerNotes': customerNotes,
      if (lastKnownLocation != null)
        'lastKnownLocation': lastKnownLocation!.toJson(),
    };
  }
}

/// Cart item in an order
class CartItem {
  final String id;
  final Product product;
  final int quantity;
  final String variantId;
  final DateTime addedAt;

  CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    required this.variantId,
    required this.addedAt,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'] ?? '',
      product: Product.fromJson(json['product'] ?? {}),
      quantity: json['quantity'] ?? 1,
      variantId: json['variantId'] ?? '',
      addedAt: _parseDateTime(json['addedAt']) ?? DateTime.now(),
    );
  }

  /// Helper method to parse DateTime from various formats
  static DateTime? _parseDateTime(dynamic value) {
    return parseTimestamp(value);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product': product.toJson(),
      'quantity': quantity,
      'variantId': variantId,
      'addedAt': Timestamp.fromDate(addedAt),
    };
  }

  Amount get totalPrice {
    final variantPrice = product.variants[variantId]?.price;
    if (variantPrice == null) {
      return Amount(value: 0, currency: 'INR', symbol: '₹');
    }
    return Amount(
      value: variantPrice.value * quantity,
      currency: variantPrice.currency,
      symbol: variantPrice.symbol,
    );
  }
}

/// Matches Order interface from libs/shared/models
class Order {
  final String id;
  final NikatShop? shop;
  final List<CartItem> items;
  final Amount? subtotal;
  final OrderFees? fees;
  final Amount? taxes;
  final Amount? totalAmount;
  final DateTime placedAt;
  final DateTime? paidAt;
  final String status;
  final String? scheduledDeliveryTime;
  final PaymentMethod paymentMethod;
  final ShopOrderType type;
  final UserAddress address;
  final SubscriptionDetails? subscriptionDetails;
  final OrderFulfillment? fulfillment;
  final Review? review; // Shop review linked to this order

  Order({
    required this.id,
    this.shop,
    required this.items,
    this.subtotal,
    this.fees,
    this.taxes,
    this.totalAmount,
    required this.placedAt,
    this.paidAt,
    required this.status,
    this.scheduledDeliveryTime,
    required this.paymentMethod,
    required this.type,
    required this.address,
    this.subscriptionDetails,
    this.fulfillment,
    this.review,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    Amount? parseAmount(dynamic value) {
      if (value == null) return null;
      if (value is Map<String, dynamic>) {
        return Amount.fromJson(value);
      }
      if (value is num) {
        return Amount(value: value.toDouble(), currency: 'INR', symbol: '₹');
      }
      return null;
    }

    return Order(
      id: json['id'] ?? '',
      shop: json['shop'] != null ? NikatShop.fromJson(json['shop']) : null,
      items:
          (json['items'] as List?)?.map((i) => CartItem.fromJson(i)).toList() ??
          [],
      subtotal: parseAmount(json['subtotal']),
      fees: json['fees'] != null ? OrderFees.fromJson(json['fees']) : null,
      taxes: parseAmount(json['taxes']),
      totalAmount: parseAmount(json['totalAmount']),
      placedAt: _parseDateTime(json['placedAt']) ?? DateTime.now(),
      paidAt: _parseDateTime(json['paidAt']),
      status: json['status'] ?? 'pending',
      scheduledDeliveryTime: json['scheduledDeliveryTime'],
      paymentMethod: PaymentMethod.fromJson(json['paymentMethod'] ?? 'N/A'),
      type: OrderType.fromJson(json['type'] ?? 'N/A'),
      address: UserAddress.fromJson(json['address'] ?? {}),
      subscriptionDetails: json['subscriptionDetails'] != null
          ? SubscriptionDetails.fromJson(json['subscriptionDetails'])
          : null,
      fulfillment: json['fulfillment'] != null
          ? OrderFulfillment.fromJson(json['fulfillment'])
          : null,
      review: json['review'] != null ? Review.fromJson(json['review']) : null,
    );
  }

  /// Helper method to parse DateTime from various formats
  static DateTime? _parseDateTime(dynamic value) {
    return parseTimestamp(value);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (shop != null) 'shop': shop!.toJson(),
      'items': items.map((i) => i.toJson()).toList(),
      if (subtotal != null) 'subtotal': subtotal!.toJson(),
      if (fees != null) 'fees': fees!.toJson(),
      if (taxes != null) 'taxes': taxes!.toJson(),
      if (totalAmount != null) 'totalAmount': totalAmount!.toJson(),
      'placedAt': Timestamp.fromDate(placedAt),
      if (paidAt != null) 'paidAt': Timestamp.fromDate(paidAt!),
      'status': status,
      if (scheduledDeliveryTime != null)
        'scheduledDeliveryTime': scheduledDeliveryTime,
      'paymentMethod': paymentMethod,
      'type': type,
      'address': address.toJson(),
      if (subscriptionDetails != null)
        'subscriptionDetails': subscriptionDetails!.toJson(),
      if (fulfillment != null) 'fulfillment': fulfillment!.toJson(),
      if (review != null) 'review': review!.toJson(),
    };
  }

  /// Get user-facing formatted status
  String get formattedStatus {
    switch (status.toUpperCase()) {
      case 'PROCESSING':
        return 'Processing';
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'ACCEPTED_BY_SHOP':
        return 'Accepted';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      default:
        // Convert SNAKE_CASE to Title Case
        return status
            .split('_')
            .map(
              (word) => word.isEmpty
                  ? ''
                  : word[0].toUpperCase() + word.substring(1).toLowerCase(),
            )
            .join(' ');
    }
  }
}
