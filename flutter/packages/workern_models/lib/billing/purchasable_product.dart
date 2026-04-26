import 'package:workern_models/amount.dart';
import 'package:workern_models/base.dart';
import 'billing_interval_unit.dart';
import 'payment_type.dart';
import 'product_status.dart';
import 'transaction_processor_id.dart';

class ProductGatewayPrice {
  final Amount amount;
  final int? intervalCount;
  final BillingIntervalUnit? intervalUnit;
  final int? trialDays;
  final String? displayLabel;

  const ProductGatewayPrice({
    required this.amount,
    this.intervalCount,
    this.intervalUnit,
    this.trialDays,
    this.displayLabel,
  });

  factory ProductGatewayPrice.fromJson(Map<String, dynamic> json) {
    return ProductGatewayPrice(
      amount: Amount.fromJson(
        Map<String, dynamic>.from(json['amount'] as Map? ?? {}),
      ),
      intervalCount: (json['intervalCount'] as num?)?.toInt(),
      intervalUnit: json['intervalUnit'] != null
          ? BillingIntervalUnitX.fromValue(json['intervalUnit'] as String)
          : null,
      trialDays: (json['trialDays'] as num?)?.toInt(),
      displayLabel: json['displayLabel'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount.toJson(),
      'intervalCount': intervalCount,
      'intervalUnit': intervalUnit?.value,
      'trialDays': trialDays,
      'displayLabel': displayLabel,
    };
  }
}

class ProductGatewayConfig {
  final TransactionProcessorID gateway;
  final bool enabled;
  final String? externalProductId;
  final String? externalPriceId;
  final String? checkoutUrl;
  final ProductGatewayPrice price;
  final Map<String, dynamic>? metadata;

  const ProductGatewayConfig({
    required this.gateway,
    required this.enabled,
    this.externalProductId,
    this.externalPriceId,
    this.checkoutUrl,
    required this.price,
    this.metadata,
  });

  factory ProductGatewayConfig.fromJson(Map<String, dynamic> json) {
    return ProductGatewayConfig(
      gateway: TransactionProcessorIDX.fromValue(
        (json['gateway'] as String?) ?? 'RAZORPAY',
      ),
      enabled: json['enabled'] as bool? ?? false,
      externalProductId: json['externalProductId'] as String?,
      externalPriceId: json['externalPriceId'] as String?,
      checkoutUrl: json['checkoutUrl'] as String?,
      price: ProductGatewayPrice.fromJson(
        Map<String, dynamic>.from(json['price'] as Map? ?? {}),
      ),
      metadata: json['metadata'] != null
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gateway': gateway.value,
      'enabled': enabled,
      'externalProductId': externalProductId,
      'externalPriceId': externalPriceId,
      'checkoutUrl': checkoutUrl,
      'price': price.toJson(),
      'metadata': metadata,
    };
  }
}

/// Top-level entitlement document at: entitlements/{entitlementId}
/// Defines WHAT access a user gets (e.g., "pro", "premium").
/// Products live as a subcollection under each entitlement.
class BillingEntitlement extends Base {
  final String appId;
  final String name;
  final List<String>? features;
  final Map<String, dynamic>? metadata;

  BillingEntitlement({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.appId,
    required this.name,
    this.features,
    this.metadata,
  });

  factory BillingEntitlement.fromJson(Map<String, dynamic> json) {
    return BillingEntitlement(
      id: (json['id'] as String?) ?? '',
      createdAt: Base.parseBaseFields(json)['createdAt'] as DateTime,
      updatedAt: Base.parseBaseFields(json)['updatedAt'] as DateTime,
      owner: Base.parseBaseFields(json)['owner'] as BaseOwner,
      space: Base.parseBaseFields(json)['space'] as BaseSpace,
      appId: (json['appId'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      features: (json['features'] as List?)?.map((e) => '$e').toList(),
      metadata: json['metadata'] != null
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : null,
    );
  }

  @override
  Map<String, dynamic> baseToJson() {
    return {
      ...super.baseToJson(),
      'appId': appId,
      'name': name,
      'features': features,
      'metadata': metadata,
    };
  }
}

class ProductAppRef {
  final String id;
  final String? name;

  const ProductAppRef({required this.id, this.name});

  factory ProductAppRef.fromJson(Map<String, dynamic> json) {
    return ProductAppRef(
      id: (json['id'] as String?) ?? '',
      name: json['name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name};
  }
}

class PurchasableProduct extends Base {
  /// ID of the parent entitlement (entitlements/{entitlementId})
  final String entitlementId;
  final String key;
  final ProductAppRef app;
  final String name;
  final String? description;
  final PaymentType paymentType;
  final ProductStatus status;
  final List<String>? features;
  final int? sortOrder;
  final Map<String, ProductGatewayConfig> gateways;
  final Map<String, dynamic>? metadata;

  PurchasableProduct({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.entitlementId,
    required this.key,
    required this.app,
    required this.name,
    this.description,
    required this.paymentType,
    required this.status,
    this.features,
    this.sortOrder,
    required this.gateways,
    this.metadata,
  });

  factory PurchasableProduct.fromJson(Map<String, dynamic> json) {
    final gatewaysRaw = Map<String, dynamic>.from(
      json['gateways'] as Map? ?? <String, dynamic>{},
    );

    final mappedGateways = <String, ProductGatewayConfig>{};
    gatewaysRaw.forEach((key, value) {
      mappedGateways[key] = ProductGatewayConfig.fromJson(
        Map<String, dynamic>.from(value as Map),
      );
    });

    return PurchasableProduct(
      id: json['id'] as String? ?? '',
      createdAt: Base.parseBaseFields(json)['createdAt'] as DateTime,
      updatedAt: Base.parseBaseFields(json)['updatedAt'] as DateTime,
      owner: Base.parseBaseFields(json)['owner'] as BaseOwner,
      space: Base.parseBaseFields(json)['space'] as BaseSpace,
      key: (json['key'] as String?) ?? '',
      app: ProductAppRef.fromJson(
        Map<String, dynamic>.from(json['app'] as Map? ?? {}),
      ),
      name: (json['name'] as String?) ?? '',
      description: json['description'] as String?,
      paymentType: PaymentTypeX.fromValue(
        (json['paymentType'] as String?) ?? 'ONE_TIME',
      ),
      status: ProductStatusX.fromValue(
        (json['status'] as String?) ?? 'INACTIVE',
      ),
      entitlementId: (json['entitlementId'] as String?) ?? '',
      features: (json['features'] as List?)?.map((e) => '$e').toList(),
      sortOrder: (json['sortOrder'] as num?)?.toInt(),
      gateways: mappedGateways,
      metadata: json['metadata'] != null
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : null,
    );
  }

  @override
  Map<String, dynamic> baseToJson() {
    final gatewayMap = <String, dynamic>{};
    gateways.forEach((key, value) {
      gatewayMap[key] = value.toJson();
    });

    return {
      ...super.baseToJson(),
      'key': key,
      'app': app.toJson(),
      'name': name,
      'description': description,
      'paymentType': paymentType.value,
      'status': status.value,
      'features': features,
      'sortOrder': sortOrder,
      'entitlementId': entitlementId,
      'gateways': gatewayMap,
      'metadata': metadata,
    };
  }
}
