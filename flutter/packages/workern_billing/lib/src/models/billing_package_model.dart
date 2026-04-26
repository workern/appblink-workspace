import 'package:purchases_flutter/purchases_flutter.dart';

/// Represents a purchasable package fetched from RevenueCat offerings.
class BillingPackageModel {
  final String identifier;
  final String price;
  final String title;
  final String description;

  /// The underlying RevenueCat [Package]. Kept internal for purchasing.
  final Package _package;

  BillingPackageModel({
    required this.identifier,
    required this.price,
    required this.title,
    required this.description,
    required Package package,
  }) : _package = package;

  Package get revenueCatPackage => _package;

  factory BillingPackageModel.fromPackage(Package package) {
    final product = package.storeProduct;
    return BillingPackageModel(
      identifier: product.identifier,
      price: product.priceString,
      title: product.title,
      description: product.description,
      package: package,
    );
  }

  @override
  String toString() => 'BillingPackageModel($identifier, $price)';
}
