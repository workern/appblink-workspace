enum ProductVisibility {
  all,
  enabled,
  none;

  String toJson() => name;

  static ProductVisibility fromJson(String value) {
    switch (value) {
      case 'all':
        return ProductVisibility.all;
      case 'enabled':
        return ProductVisibility.enabled;
      case 'none':
        return ProductVisibility.none;
      default:
        return ProductVisibility.none;
    }
  }
}
