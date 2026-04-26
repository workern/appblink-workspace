/// Shop visibility settings
class VisibilityDetails {
  final bool shop;
  final String products; // 'all', 'enabled', 'none'

  VisibilityDetails({required this.shop, this.products = 'all'});

  factory VisibilityDetails.fromJson(Map<String, dynamic> json) =>
      VisibilityDetails(
        shop: json['shop'] ?? true,
        products: json['products'] ?? 'all',
      );

  Map<String, dynamic> toJson() => {'shop': shop, 'products': products};
}
