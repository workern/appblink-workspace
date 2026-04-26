import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';

import 'amount.dart';
import 'base.dart';
import 'shop/models/shop_logos.dart';

/// Amount tracking model for prices and rates
class AmountTracking {
  final Amount latest;
  final Amount lowest;
  final Amount highest;
  final Amount oldest;
  final Amount avg;

  AmountTracking({
    required this.latest,
    required this.lowest,
    required this.highest,
    required this.oldest,
    required this.avg,
  });

  factory AmountTracking.fromJson(Map<String, dynamic> json) {
    // Handle old format where json contains arbitrary keys with Amount values
    // Extract all Amount values and use the first one for all fields
    if (!json.containsKey('latest') && json.isNotEmpty) {
      // Old format: convert first value to all tracking fields
      final firstValue = json.values.first;
      final amount = firstValue is Map<String, dynamic>
          ? Amount.fromJson(firstValue)
          : Amount(value: 0, currency: 'INR', symbol: '₹');

      return AmountTracking(
        latest: amount,
        lowest: amount,
        highest: amount,
        oldest: amount,
        avg: amount,
      );
    }

    // New format: use specific keys
    return AmountTracking(
      latest: json['latest'] != null
          ? Amount.fromJson(json['latest'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      lowest: json['lowest'] != null
          ? Amount.fromJson(json['lowest'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      highest: json['highest'] != null
          ? Amount.fromJson(json['highest'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      oldest: json['oldest'] != null
          ? Amount.fromJson(json['oldest'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      avg: json['avg'] != null
          ? Amount.fromJson(json['avg'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
    );
  }

  Map<String, dynamic> toJson() => {
    'latest': latest.toJson(),
    'lowest': lowest.toJson(),
    'highest': highest.toJson(),
    'oldest': oldest.toJson(),
    'avg': avg.toJson(),
  };
}

/// Expiry date tracking model
class ExpiryDateTracking {
  final DateTime closest;
  final List<DateTime> all;
  final DateTime farthest;

  ExpiryDateTracking({
    required this.closest,
    required this.all,
    required this.farthest,
  });

  factory ExpiryDateTracking.fromJson(Map<String, dynamic> json) {
    return ExpiryDateTracking(
      closest: parseTimestamp(json['closest']) ?? DateTime.now(),
      all:
          (json['all'] as List<dynamic>?)
              ?.map((e) => parseTimestamp(e) ?? DateTime.now())
              .toList() ??
          [],
      farthest: parseTimestamp(json['farthest']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'closest': Timestamp.fromDate(closest),
    'all': all.map((date) => Timestamp.fromDate(date)).toList(),
    'farthest': Timestamp.fromDate(farthest),
  };
}

/// Shop reference model for Item
class ItemShop {
  final String id;
  final String category;
  final String name;
  final ShopLogos? logos;

  ItemShop({
    required this.id,
    required this.category,
    required this.name,
    this.logos,
  });

  factory ItemShop.fromJson(Map<String, dynamic> json) {
    return ItemShop(
      id: json['id'] ?? '',
      category: json['category'] ?? '',
      name: json['name'] ?? '',
      logos: json['logos'] != null ? ShopLogos.fromJson(json['logos']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'category': category,
    'name': name,
    if (logos != null) 'logos': logos!.toJson(),
  };
}

/// Item model for Sangrah matching TypeScript Item interface
class ItemVariant {
  final String id;
  final String name;
  final int quantity;
  final bool available;
  final int sellableQuantityPerUnit;
  final int sellableQuantity;
  final AmountTracking mrps;
  final AmountTracking rates;
  final ExpiryDateTracking expiryDates;
  final List<String> batchCodes;
  final Amount totalSpent;
  final Amount totalRevenue;
  final int? sortOrder;
  final String? sku;
  final String? barcode;
  final Map<String, dynamic>? weight;
  final Map<String, dynamic>? dimensions;

  ItemVariant({
    required this.id,
    required this.name,
    required this.quantity,
    required this.available,
    required this.sellableQuantityPerUnit,
    required this.sellableQuantity,
    required this.mrps,
    required this.rates,
    required this.expiryDates,
    required this.batchCodes,
    required this.totalSpent,
    required this.totalRevenue,
    this.sortOrder,
    this.sku,
    this.barcode,
    this.weight,
    this.dimensions,
  });

  factory ItemVariant.fromJson(Map<String, dynamic> json) {
    return ItemVariant(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      available: json['available'] ?? false,
      sellableQuantityPerUnit: json['sellableQuantityPerUnit'] ?? 0,
      sellableQuantity: json['sellableQuantity'] ?? 0,
      mrps: json['mrps'] != null
          ? AmountTracking.fromJson(json['mrps'])
          : AmountTracking(
              latest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              lowest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              highest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              oldest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              avg: Amount(value: 0, currency: 'INR', symbol: '₹'),
            ),
      rates: json['rates'] != null
          ? AmountTracking.fromJson(json['rates'])
          : AmountTracking(
              latest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              lowest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              highest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              oldest: Amount(value: 0, currency: 'INR', symbol: '₹'),
              avg: Amount(value: 0, currency: 'INR', symbol: '₹'),
            ),
      expiryDates: json['expiryDates'] != null
          ? ExpiryDateTracking.fromJson(json['expiryDates'])
          : ExpiryDateTracking(
              closest: DateTime.now(),
              all: [],
              farthest: DateTime.now(),
            ),
      batchCodes: json['batchCodes'] != null
          ? List<String>.from(json['batchCodes'])
          : [],
      totalSpent: json['totalSpent'] != null
          ? Amount.fromJson(json['totalSpent'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      totalRevenue: json['totalRevenue'] != null
          ? Amount.fromJson(json['totalRevenue'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      sortOrder: json['sortOrder'],
      sku: json['sku'],
      barcode: json['barcode'],
      weight: json['weight'],
      dimensions: json['dimensions'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'quantity': quantity,
    'available': available,
    'sellableQuantityPerUnit': sellableQuantityPerUnit,
    'sellableQuantity': sellableQuantity,
    'mrps': mrps.toJson(),
    'rates': rates.toJson(),
    'expiryDates': expiryDates.toJson(),
    'batchCodes': batchCodes,
    'totalSpent': totalSpent.toJson(),
    'totalRevenue': totalRevenue.toJson(),
    if (sortOrder != null) 'sortOrder': sortOrder,
    if (sku != null) 'sku': sku,
    if (barcode != null) 'barcode': barcode,
    if (weight != null) 'weight': weight,
    if (dimensions != null) 'dimensions': dimensions,
  };
}

/// Item model for Sangrah matching TypeScript Item interface
class Item extends Base {
  final String name;
  final String description;
  final ItemShop shop;
  final Map<String, ItemVariant> variants;
  final String defaultVariantId;
  final bool available;
  final bool hasVariants;
  final List<String> imageUrls;
  final Map<String, dynamic> nikat;
  final Amount totalSpent;
  final Amount totalRevenue;
  final List<String> supplierIds;

  Item({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.name,
    required this.description,
    required this.shop,
    required this.variants,
    required this.defaultVariantId,
    required this.available,
    required this.hasVariants,
    required this.imageUrls,
    required this.nikat,
    required this.totalSpent,
    required this.totalRevenue,
    required this.supplierIds,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    final baseFields = Base.parseBaseFields(json);
    return Item(
      id: baseFields['id'],
      createdAt: baseFields['createdAt'],
      updatedAt: baseFields['updatedAt'],
      owner: baseFields['owner'],
      space: baseFields['space'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      shop: ItemShop.fromJson(json['shop'] ?? {}),
      variants:
          (json['variants'] as Map<String, dynamic>?)?.map(
            (key, value) => MapEntry(key, ItemVariant.fromJson(value)),
          ) ??
          {},
      defaultVariantId: json['defaultVariantId'] ?? 'default',
      available: json['available'] ?? false,
      hasVariants: json['hasVariants'] ?? false,
      imageUrls: json['imageUrls'] != null
          ? List<String>.from(json['imageUrls'])
          : [],
      nikat: json['nikat'] ?? {},
      totalSpent: json['totalSpent'] != null
          ? Amount.fromJson(json['totalSpent'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      totalRevenue: json['totalRevenue'] != null
          ? Amount.fromJson(json['totalRevenue'])
          : Amount(value: 0, currency: 'INR', symbol: '₹'),
      supplierIds: json['supplierIds'] != null
          ? List<String>.from(json['supplierIds'])
          : [],
    );
  }

  Map<String, dynamic> toJson() => {
    ...baseToJson(),
    'name': name,
    'description': description,
    'shop': shop.toJson(),
    'variants': variants.map((key, value) => MapEntry(key, value.toJson())),
    'defaultVariantId': defaultVariantId,
    'available': available,
    'hasVariants': hasVariants,
    'imageUrls': imageUrls,
    'nikat': nikat,
    'totalSpent': totalSpent.toJson(),
    'totalRevenue': totalRevenue.toJson(),
    'supplierIds': supplierIds,
  };
}
