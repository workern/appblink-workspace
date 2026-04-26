enum ProductStatus { active, inactive, archived }

extension ProductStatusX on ProductStatus {
  String get value {
    switch (this) {
      case ProductStatus.active:
        return 'ACTIVE';
      case ProductStatus.inactive:
        return 'INACTIVE';
      case ProductStatus.archived:
        return 'ARCHIVED';
    }
  }

  static ProductStatus fromValue(String value) {
    return ProductStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => ProductStatus.inactive,
    );
  }
}
