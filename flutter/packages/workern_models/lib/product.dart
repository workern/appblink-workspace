import 'package:cloud_firestore/cloud_firestore.dart';
import 'amount.dart';
import 'offer.dart';
import 'shop/models/shop_logos.dart';
import 'verification.dart';
import 'rating/rating.dart';

/// Product variant/option
/// Represents a specific variant (size, volume, etc.) of a product
class ProductVariant {
  ProductVariant({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.available,
    this.sku,
    this.offers,
  });
  final String id;
  final String name;
  final Amount price;
  final int quantity;
  final bool available;
  final String? sku;
  final List<VariantOffer>? offers;

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    price: json['price'] is Map<String, dynamic>
        ? Amount.fromJson(json['price'])
        : Amount(
            value: (json['price'] as num?)?.toDouble() ?? 0,
            currency: 'INR',
            symbol: '₹',
          ),
    quantity: json['quantity'] ?? 0,
    available: json['available'] ?? true,
    sku: json['sku'],
    offers: json['offers'] != null
        ? (json['offers'] as List).map((o) => VariantOffer.fromJson(o)).toList()
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'price': price.toJson(),
    'quantity': quantity,
    'available': available,
    if (sku != null) 'sku': sku,
    if (offers != null) 'offers': offers!.map((o) => o.toJson()).toList(),
  };

  /// Get the first valid offer for this variant
  VariantOffer? get validOffer {
    if (offers == null || offers!.isEmpty) return null;
    return offers!.firstWhere(
      (offer) => offer.isValid,
      orElse: () => offers!.first,
    );
  }

  /// Get the discounted price if an offer is available
  Amount? get discountedPrice {
    final offer = validOffer;
    if (offer == null) return null;
    return offer.calculateDiscountedPrice(price);
  }

  /// Get the actual price to display (discounted or original)
  Amount get displayPrice => discountedPrice ?? price;
}

/// Shop summary for product display
class ShopSummary {
  ShopSummary({
    required this.id,
    required this.name,
    required this.category,
    required this.logos,
  });

  factory ShopSummary.fromJson(Map<String, dynamic> json) => ShopSummary(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    category: json['category'] ?? '',
    logos: ShopLogos.fromJson(json['logos']),
  );
  final String id;
  final String name;
  final String category;
  final ShopLogos logos;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'category': category,
    'logos': logos.toJson(),
  };
}

/// Matches Product interface from libs/shared/models
/// Represents a product with variants and shop information
class Product {
  final String id;
  final String name;
  final ShopSummary shop;
  final String description;
  final List<String> imageUrls;
  final bool visible;
  final Verification verification;
  final String? category;
  final Rating rating;
  final bool available;
  final List<String> offerIds;
  final Map<String, ProductVariant> variants;
  final String defaultVariantId;
  final bool hasVariants;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.shop,
    required this.description,
    required this.imageUrls,
    required this.visible,
    required this.verification,
    this.category,
    required this.rating,
    required this.available,
    required this.offerIds,
    required this.variants,
    required this.defaultVariantId,
    required this.hasVariants,
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final variantsMap =
        (json['variants'] as Map?)?.cast<String, Map<String, dynamic>>() ?? {};
    final variants = <String, ProductVariant>{};
    variantsMap.forEach((key, value) {
      variants[key] = ProductVariant.fromJson(value);
    });

    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      shop: ShopSummary.fromJson(json['shop'] ?? {}),
      description: json['description'] ?? '',
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      visible: json['visible'] ?? true,
      verification: Verification.fromJson(json['verification'] ?? {}),
      category: json['category'],
      rating: json['rating'] is Map<String, dynamic>
          ? Rating.fromJson(json['rating'])
          : Rating.empty(),
      available: json['available'] ?? true,
      offerIds: json['offerIds'] != null
          ? List<String>.from(json['offerIds'])
          : [],
      variants: variants,
      defaultVariantId: json['defaultVariantId'] ?? 'default',
      hasVariants: json['hasVariants'] ?? false,
      createdAt: (json['createdAt'] as Timestamp?)?.toDate(),
      updatedAt: (json['updatedAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'shop': shop.toJson(),
    'description': description,
    'imageUrls': imageUrls,
    'visible': visible,
    'verification': verification.toJson(),
    if (category != null) 'category': category,
    'rating': rating.toJson(),
    'available': available,
    'offerIds': offerIds,
    'variants': variants.map((k, v) => MapEntry(k, v.toJson())),
    'defaultVariantId': defaultVariantId,
    'hasVariants': hasVariants,
    if (createdAt != null) 'createdAt': Timestamp.fromDate(createdAt!),
    if (updatedAt != null) 'updatedAt': Timestamp.fromDate(updatedAt!),
  };

  /// Get the default variant or first available
  ProductVariant? getDefaultVariant() =>
      variants[defaultVariantId] ??
      (variants.isNotEmpty ? variants.values.first : null);

  /// Get variant by ID
  ProductVariant? getVariant(String variantId) => variants[variantId];

  /// Get price of default variant
  Amount? get defaultPrice => getDefaultVariant()?.price;

  Amount? getVariantPrice(String variantId) => getVariant(variantId)?.price;
}
