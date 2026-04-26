import 'base_model.dart';
import 'amount.dart';

enum ProductCategory { FOOD, MEDICINE, COSMETICS, OTHER }

enum PackagingType { BOTTLE, POUCH, PACKET, BOX, TUBE, OTHER }

enum ProductStatus { EXPIRED, EXPIRING_SOON, ACTIVE }

class ExpiredProduct extends BaseModel {
  final String name;
  final ProductCategory category;
  final PackagingType packagingType;
  final String location;
  final int quantity;
  final String manufactureDate;
  final String expiryDate;
  final String? notes;
  final Amount? amount;
  final String? imageUrl;
  final ProductStatus status;

  ExpiredProduct({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.name,
    required this.category,
    required this.packagingType,
    required this.location,
    required this.quantity,
    required this.manufactureDate,
    required this.expiryDate,
    this.notes,
    this.amount,
    this.imageUrl,
    required this.status,
  });

  factory ExpiredProduct.fromJson(Map<String, dynamic> json) {
    return ExpiredProduct(
      id: json['id'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      owner: json['owner'],
      space: json['space'],
      name: json['name'],
      category: ProductCategory.values.firstWhere(
        (e) => e.name == (json['category'] as String).toUpperCase(),
      ),
      packagingType: PackagingType.values.firstWhere(
        (e) => e.name == (json['packagingType'] as String).toUpperCase(),
      ),
      location: json['location'],
      quantity: json['quantity'],
      manufactureDate: json['manufactureDate'],
      expiryDate: json['expiryDate'],
      notes: json['notes'],
      amount: json['amount'] != null ? Amount.fromJson(json['amount']) : null,
      imageUrl: json['imageUrl'],
      status: ProductStatus.values.firstWhere(
        (e) => e.name == (json['status'] as String).toUpperCase(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'owner': owner,
      'space': space,
      'name': name,
      'category': category.name,
      'packagingType': packagingType.name,
      'location': location,
      'quantity': quantity,
      'manufactureDate': manufactureDate,
      'expiryDate': expiryDate,
      'notes': notes,
      'amount': amount?.toJson(),
      'imageUrl': imageUrl,
      'status': status.name,
    };
  }
}
