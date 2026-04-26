import 'package:workern_utils/workern_utils.dart';
import 'amount.dart';

/// Offer discount type
enum OfferDiscountType {
  percentage,
  fixed,
  fixedPrice;

  String toJson() => name.toUpperCase();

  static OfferDiscountType fromJson(String value) {
    switch (value.toUpperCase()) {
      case 'PERCENTAGE':
        return OfferDiscountType.percentage;
      case 'FIXED':
        return OfferDiscountType.fixed;
      case 'FIXED_PRICE':
        return OfferDiscountType.fixedPrice;
      default:
        return OfferDiscountType.percentage;
    }
  }
}

/// Variant offer - inline discount information for a product variant
/// Simplified version for customer-facing display in the Nikat app
class VariantOffer {
  /// Optional id referencing a central Offer document
  final String? id;

  /// Short title shown in UI (e.g. "10% off")
  final String? title;

  /// Small badge text for compact UI (e.g. "Deal", "10% OFF")
  final String? badge;

  /// Type of the inline discount
  final OfferDiscountType? type;

  /// Percentage value (use when type === 'PERCENTAGE'). Example: 10 for 10%.
  final double? percentage;

  /// Fixed discount amount (use when type === 'FIXED')
  final Amount? fixedAmount;

  /// If type === 'FIXED_PRICE', this amount becomes the final price for the variant
  final Amount? fixedPrice;

  /// Validity window for display/quick eligibility checks (ISO datetime strings)
  final DateTime? validFrom;
  final DateTime? validUntil;

  /// Priority for multiple inline offers — higher wins when resolving simple conflicts
  final int? priority;

  /// Whether this inline offer can be combined with other offers (simple flag)
  final bool? combinable;

  /// Small free-form metadata if required for UI (e.g. marketing tag)
  final Map<String, dynamic>? metadata;

  VariantOffer({
    this.id,
    this.title,
    this.badge,
    this.type,
    this.percentage,
    this.fixedAmount,
    this.fixedPrice,
    this.validFrom,
    this.validUntil,
    this.priority,
    this.combinable,
    this.metadata,
  });

  factory VariantOffer.fromJson(Map<String, dynamic> json) {
    return VariantOffer(
      id: json['id'],
      title: json['title'],
      badge: json['badge'],
      type: json['type'] != null
          ? OfferDiscountType.fromJson(json['type'])
          : null,
      percentage: (json['percentage'] as num?)?.toDouble(),
      fixedAmount: json['fixedAmount'] != null
          ? Amount.fromJson(json['fixedAmount'])
          : null,
      fixedPrice: json['fixedPrice'] != null
          ? Amount.fromJson(json['fixedPrice'])
          : null,
      validFrom: parseTimestamp(json['validFrom']),
      validUntil: parseTimestamp(json['validUntil']),
      priority: json['priority'],
      combinable: json['combinable'],
      metadata: json['metadata'] != null
          ? Map<String, dynamic>.from(json['metadata'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (badge != null) 'badge': badge,
      if (type != null) 'type': type!.toJson(),
      if (percentage != null) 'percentage': percentage,
      if (fixedAmount != null) 'fixedAmount': fixedAmount!.toJson(),
      if (fixedPrice != null) 'fixedPrice': fixedPrice!.toJson(),
      if (validFrom != null) 'validFrom': validFrom!.toIso8601String(),
      if (validUntil != null) 'validUntil': validUntil!.toIso8601String(),
      if (priority != null) 'priority': priority,
      if (combinable != null) 'combinable': combinable,
      if (metadata != null) 'metadata': metadata,
    };
  }

  /// Check if the offer is currently valid based on time
  bool get isValid {
    final now = DateTime.now();
    if (validFrom != null && now.isBefore(validFrom!)) return false;
    if (validUntil != null && now.isAfter(validUntil!)) return false;
    return true;
  }

  /// Calculate the discounted price based on the offer
  Amount? calculateDiscountedPrice(Amount originalPrice) {
    if (!isValid) return null;

    switch (type) {
      case OfferDiscountType.percentage:
        if (percentage != null) {
          final discountAmount = originalPrice.value * (percentage! / 100);
          return Amount(
            value: originalPrice.value - discountAmount,
            currency: originalPrice.currency,
            symbol: originalPrice.symbol,
          );
        }
        break;
      case OfferDiscountType.fixed:
        if (fixedAmount != null) {
          return Amount(
            value: (originalPrice.value - fixedAmount!.value).clamp(
              0,
              double.infinity,
            ),
            currency: originalPrice.currency,
            symbol: originalPrice.symbol,
          );
        }
        break;
      case OfferDiscountType.fixedPrice:
        return fixedPrice;
      default:
        break;
    }
    return null;
  }

  /// Get the discount amount
  Amount? getDiscountAmount(Amount originalPrice) {
    if (!isValid) return null;

    switch (type) {
      case OfferDiscountType.percentage:
        if (percentage != null) {
          final discountAmount = originalPrice.value * (percentage! / 100);
          return Amount(
            value: discountAmount,
            currency: originalPrice.currency,
            symbol: originalPrice.symbol,
          );
        }
        break;
      case OfferDiscountType.fixed:
        return fixedAmount;
      case OfferDiscountType.fixedPrice:
        if (fixedPrice != null) {
          return Amount(
            value: (originalPrice.value - fixedPrice!.value).clamp(
              0,
              double.infinity,
            ),
            currency: originalPrice.currency,
            symbol: originalPrice.symbol,
          );
        }
        break;
      default:
        break;
    }
    return null;
  }
}
