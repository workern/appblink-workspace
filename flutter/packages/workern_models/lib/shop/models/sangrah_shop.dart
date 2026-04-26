import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/google_place.dart';
import 'package:workern_utils/workern_utils.dart';
import '../../amount.dart';
import '../index.dart';
import '../../coordinates.dart';
import '../../verification.dart';

/// Shop Owner model
class ShopOwner {
  final String uid;
  final String name;

  ShopOwner({required this.uid, required this.name});

  factory ShopOwner.fromJson(Map<String, dynamic> json) {
    return ShopOwner(uid: json['uid'] ?? '', name: json['name'] ?? '');
  }

  Map<String, dynamic> toJson() => {'uid': uid, 'name': name};
}

/// Space reference model
class SpaceReference {
  final String id;

  SpaceReference({required this.id});

  factory SpaceReference.fromJson(Map<String, dynamic> json) {
    return SpaceReference(id: json['id'] ?? '');
  }

  Map<String, dynamic> toJson() => {'id': id};
}

/// Sangrah Shop model matching TypeScript SangrahShop interface
class SangrahShop {
  final String? id;
  final String name;
  final String contactNumber;
  final String category;
  final String? whatsappNumber;
  final GooglePlaceAddress address;
  final String? email;
  final Verification? verification;
  final NikatSettings nikatSettings;
  final ShopLogos logos;
  final ShopOwner owner;
  final SpaceReference space;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  SangrahShop({
    this.id,
    required this.name,
    required this.contactNumber,
    required this.category,
    this.whatsappNumber,
    required this.address,
    this.email,
    this.verification,
    required this.nikatSettings,
    required this.logos,
    required this.owner,
    required this.space,
    this.createdAt,
    this.updatedAt,
  });

  factory SangrahShop.fromJson(Map<String, dynamic> json) {
    try {
      return SangrahShop(
        id: (json['id'] as dynamic)?.toString() ?? '',
        name: _safeString(json['name']),
        contactNumber: _safeString(json['contactNumber']),
        category: _safeString(json['category'], 'other'),
        whatsappNumber: _safeString(json['whatsappNumber']),
        address:
            json['address'] != null && json['address'] is Map<String, dynamic>
            ? GooglePlaceAddress.fromJson(
                json['address'] as Map<String, dynamic>,
              )
            : _createDefaultAddress(),
        email: _safeString(json['email']),
        verification:
            json['verification'] != null &&
                json['verification'] is Map<String, dynamic>
            ? Verification.fromJson(
                json['verification'] as Map<String, dynamic>,
              )
            : null,
        nikatSettings:
            json['nikatSettings'] != null &&
                json['nikatSettings'] is Map<String, dynamic>
            ? NikatSettings.fromJson(
                json['nikatSettings'] as Map<String, dynamic>,
              )
            : _createDefaultNikatSettings(),
        logos: json['logos'] != null && json['logos'] is Map<String, dynamic>
            ? ShopLogos.fromJson(json['logos'] as Map<String, dynamic>)
            : ShopLogos(),
        owner: json['owner'] != null && json['owner'] is Map<String, dynamic>
            ? ShopOwner.fromJson(json['owner'] as Map<String, dynamic>)
            : ShopOwner(uid: '', name: 'N/A'),
        space: json['space'] != null && json['space'] is Map<String, dynamic>
            ? SpaceReference.fromJson(json['space'] as Map<String, dynamic>)
            : SpaceReference(id: ''),
        createdAt: parseTimestamp(json['createdAt']),
        updatedAt: parseTimestamp(json['updatedAt']),
      );
    } catch (e) {
      // Log error but return a minimal valid object
      debugPrint('Error parsing SangrahShop: $e');
      return SangrahShop(
        id: (json['id'] as dynamic)?.toString() ?? '',
        name: _safeString(json['name']),
        contactNumber: _safeString(json['contactNumber']),
        category: 'other',
        address: _createDefaultAddress(),
        nikatSettings: _createDefaultNikatSettings(),
        logos: ShopLogos(),
        owner: ShopOwner(uid: '', name: 'N/A'),
        space: SpaceReference(id: ''),
      );
    }
  }

  static String _safeString(dynamic value, [String defaultValue = '']) {
    if (value == null) return defaultValue;
    if (value is String) return value.trim();
    return value.toString().trim();
  }

  static GooglePlaceAddress _createDefaultAddress() {
    return GooglePlaceAddress(
      formatted: 'N/A',
      street: 'N/A',
      city: 'N/A',
      state: 'N/A',
      postalCode: 'N/A',
      country: 'India',
      coordinates: const Coordinates(lat: 0, lng: 0, geoHash: ''),
      google: GooglePlace(),
    );
  }

  static NikatSettings _createDefaultNikatSettings() {
    return NikatSettings(
      visibility: VisibilityDetails(shop: false, products: 'none'),
      order: OrderSettings(
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
      delivery: DeliverySettings(
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
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'name': name,
    'contactNumber': contactNumber,
    'category': category,
    if (whatsappNumber != null) 'whatsappNumber': whatsappNumber,
    'address': address.toJson(),
    if (email != null) 'email': email,
    if (verification != null) 'verification': verification!.toJson(),
    'nikatSettings': nikatSettings.toJson(),
    'logos': logos.toJson(),
    'owner': owner.toJson(),
    'space': space.toJson(),
    if (createdAt != null) 'createdAt': Timestamp.fromDate(createdAt!),
    if (updatedAt != null) 'updatedAt': Timestamp.fromDate(updatedAt!),
  };
}
