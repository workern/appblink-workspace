import 'purchasable_product.dart';
import 'transaction_processor_id.dart';
import 'payment_type.dart';

class GetProductsForAppRequest {
  final String appId;
  final PaymentType? paymentType;
  final TransactionProcessorID? gateway;
  final bool? includeInactive;

  const GetProductsForAppRequest({
    required this.appId,
    this.paymentType,
    this.gateway,
    this.includeInactive,
  });

  Map<String, dynamic> toJson() {
    return {
      'appId': appId,
      'paymentType': paymentType?.value,
      'gateway': gateway?.value,
      'includeInactive': includeInactive,
    };
  }
}

class GetProductsForAppResponse {
  final String appId;
  final List<PurchasableProduct> products;

  const GetProductsForAppResponse({
    required this.appId,
    required this.products,
  });

  factory GetProductsForAppResponse.fromJson(Map<String, dynamic> json) {
    return GetProductsForAppResponse(
      appId: (json['appId'] as String?) ?? '',
      products: (json['products'] as List? ?? const [])
          .map(
            (item) => PurchasableProduct.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList(),
    );
  }
}

class CreateProductCheckoutRequest {
  final String appId;
  final String productId;
  final TransactionProcessorID gateway;
  final int? quantity;
  final String? langCode;
  final Map<String, dynamic>? metadata;

  const CreateProductCheckoutRequest({
    required this.appId,
    required this.productId,
    required this.gateway,
    this.quantity,
    this.langCode,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'appId': appId,
      'productId': productId,
      'gateway': gateway.value,
      'quantity': quantity,
      'langCode': langCode,
      'metadata': metadata,
    };
  }
}

enum ProductCheckoutMode { externalCheckout, inAppPurchase }

extension ProductCheckoutModeX on ProductCheckoutMode {
  String get value {
    switch (this) {
      case ProductCheckoutMode.externalCheckout:
        return 'EXTERNAL_CHECKOUT';
      case ProductCheckoutMode.inAppPurchase:
        return 'IN_APP_PURCHASE';
    }
  }

  static ProductCheckoutMode fromValue(String value) {
    return ProductCheckoutMode.values.firstWhere(
      (mode) => mode.value == value,
      orElse: () => ProductCheckoutMode.externalCheckout,
    );
  }
}

class CreateProductCheckoutResponse {
  final ProductCheckoutMode mode;
  final Map<String, dynamic> gateway;
  final PurchasableProduct product;
  final String? transactionId;

  const CreateProductCheckoutResponse({
    required this.mode,
    required this.gateway,
    required this.product,
    this.transactionId,
  });

  factory CreateProductCheckoutResponse.fromJson(Map<String, dynamic> json) {
    return CreateProductCheckoutResponse(
      mode: ProductCheckoutModeX.fromValue(
        (json['mode'] as String?) ?? 'EXTERNAL_CHECKOUT',
      ),
      gateway: Map<String, dynamic>.from(json['gateway'] as Map? ?? {}),
      product: PurchasableProduct.fromJson(
        Map<String, dynamic>.from(json['product'] as Map? ?? {}),
      ),
      transactionId: json['transactionId'] as String?,
    );
  }
}
