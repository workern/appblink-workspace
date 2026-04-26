/// Shop offer/promotion
class Offer {
  final String id;
  final String title;
  final String description;
  final String shopId;
  final String shopName;
  final double? discountPercentage;
  final double? flatDiscount;
  final String imageUrl;

  Offer({
    required this.id,
    required this.title,
    required this.description,
    required this.shopId,
    required this.shopName,
    this.discountPercentage,
    this.flatDiscount,
    required this.imageUrl,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    description: json['description'] ?? '',
    shopId: json['shopId'] ?? '',
    shopName: json['shopName'] ?? '',
    discountPercentage: (json['discountPercentage'] as num?)?.toDouble(),
    flatDiscount: (json['flatDiscount'] as num?)?.toDouble(),
    imageUrl: json['imageUrl'] ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'shopId': shopId,
    'shopName': shopName,
    if (discountPercentage != null) 'discountPercentage': discountPercentage,
    if (flatDiscount != null) 'flatDiscount': flatDiscount,
    'imageUrl': imageUrl,
  };
}
