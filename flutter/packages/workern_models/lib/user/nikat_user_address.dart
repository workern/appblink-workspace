import 'package:cloud_firestore/cloud_firestore.dart';
import 'address.dart';
import '../common/base.dart';
import '../location/coordinates.dart';

/// Nikat User Address model - extends both Address and Base for user addresses
class NikatUserAddress extends Address implements Base {
  @override
  final String id;
  final String type; // 'Home', 'Work', 'Other'
  final String name;
  final String mobile;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final BaseOwner owner;
  @override
  final BaseSpace space;

  final String? landmark;

  NikatUserAddress({
    required this.id,
    required this.type,
    required this.name,
    required this.mobile,
    this.landmark,
    required super.street,
    required super.city,
    required super.state,
    required super.postalCode,
    required super.formatted,
    required super.country,
    required super.coordinates,
    required this.createdAt,
    required this.updatedAt,
    required this.owner,
    required this.space,
  });

  factory NikatUserAddress.fromJson(Map<String, dynamic> json) {
    final baseFields = Base.parseBaseFields(json);
    return NikatUserAddress(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'Home',
      name: json['name'] as String? ?? '',
      mobile: json['mobile'] as String? ?? '',
      landmark: json['landmark'] as String?,
      street: json['street'] as String,
      city: json['city'] as String,
      state: json['state'] as String,
      postalCode: json['postalCode'] as String,
      formatted: json['formatted'] as String? ?? '',
      country: json['country'] as String,
      coordinates: json['coordinates'] != null
          ? Coordinates.fromJson(json['coordinates'] as Map<String, dynamic>)
          : Coordinates(lat: 0, lng: 0, geoHash: ''),
      createdAt: baseFields['createdAt'] ?? DateTime.now(),
      updatedAt: baseFields['updatedAt'] ?? DateTime.now(),
      owner: baseFields['owner'] ?? BaseOwner(uid: '', name: ''),
      space: baseFields['space'] ?? BaseSpace(id: ''),
    );
  }

  @override
  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'name': name,
    'mobile': mobile,
    if (landmark != null) 'landmark': landmark,
    'street': street,
    'city': city,
    'state': state,
    'postalCode': postalCode,
    'formatted': formatted,
    'country': country,
    'coordinates': coordinates.toJson(),
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
    'owner': owner.toJson(),
    'space': space.toJson(),
  };

  @override
  Map<String, dynamic> baseToJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
    };
  }

  NikatUserAddress copyWith({
    String? id,
    String? type,
    String? name,
    String? mobile,
    String? landmark,
    String? street,
    String? city,
    String? state,
    String? postalCode,
    String? formatted,
    String? country,
    Coordinates? coordinates,
    DateTime? createdAt,
    DateTime? updatedAt,
    BaseOwner? owner,
    BaseSpace? space,
  }) => NikatUserAddress(
    id: id ?? this.id,
    type: type ?? this.type,
    name: name ?? this.name,
    mobile: mobile ?? this.mobile,
    landmark: landmark ?? this.landmark,
    street: street ?? this.street,
    city: city ?? this.city,
    state: state ?? this.state,
    postalCode: postalCode ?? this.postalCode,
    formatted: formatted ?? this.formatted,
    country: country ?? this.country,
    coordinates: coordinates ?? this.coordinates,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    owner: owner ?? this.owner,
    space: space ?? this.space,
  );
}
