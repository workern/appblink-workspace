import 'package:equatable/equatable.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/workern_models.dart';

/// Represents a user address with geolocation support
class UserAddress extends Equatable {
  final String id;
  final String type; // 'Home', 'Work', 'Other'
  final String name;
  final String mobile;
  final String street;
  final String city;
  final String state;
  final String postalCode;
  final String formatted;
  final String? country;
  final Coordinates? coordinates;

  const UserAddress({
    required this.id,
    required this.type,
    required this.name,
    required this.mobile,
    required this.street,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.formatted,
    this.country,
    this.coordinates,
  });

  factory UserAddress.fromJson(Map<String, dynamic> json) {
    return UserAddress(
      id: json['id'] ?? '',
      type: json['type'] ?? 'Home',
      name: json['name'] ?? '',
      mobile: json['mobile'] ?? '',
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      postalCode: json['postalCode'] ?? json['zipCode'] ?? '',
      formatted: json['formatted'] ?? '',
      country: json['country'],
      coordinates: json['coordinates'] != null
          ? Coordinates.fromJson(json['coordinates'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'name': name,
      'mobile': mobile,
      'street': street,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'formatted': formatted,
      if (country != null) 'country': country,
      if (coordinates != null) 'coordinates': coordinates!.toJson(),
    };
  }

  UserAddress copyWith({
    String? id,
    String? type,
    String? name,
    String? mobile,
    String? street,
    String? city,
    String? state,
    String? postalCode,
    String? formatted,
    String? country,
    Coordinates? coordinates,
  }) {
    return UserAddress(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      mobile: mobile ?? this.mobile,
      street: street ?? this.street,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      formatted: formatted ?? this.formatted,
      country: country ?? this.country,
      coordinates: coordinates ?? this.coordinates,
    );
  }

  @override
  List<Object?> get props => [
    id,
    type,
    name,
    mobile,
    street,
    city,
    state,
    postalCode,
    formatted,
    country,
    coordinates,
  ];
}

/// Represents an application user
class User extends Equatable {
  final String uid;
  final String? email;
  final String? name;
  final String? photoURL;
  final String? mobile;
  final List<UserAddress> addresses;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.uid,
    this.email,
    this.name,
    this.photoURL,
    this.mobile,
    required this.addresses,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      uid: json['uid'] ?? '',
      email: json['email'],
      name: json['name'],
      photoURL: json['photoURL'],
      mobile: json['mobile'],
      addresses:
          (json['addresses'] as List?)
              ?.map((a) => UserAddress.fromJson(a))
              .toList() ??
          [],
      createdAt: _parseDateTime(json['createdAt']),
      updatedAt: _parseDateTime(json['updatedAt']),
    );
  }

  /// Helper method to parse DateTime from various formats
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;

    // Handle Firestore Timestamp
    if (value is Timestamp) {
      return value.toDate();
    }

    // Handle String (ISO format)
    if (value is String) {
      return DateTime.parse(value);
    }

    // Handle DateTime (already parsed)
    if (value is DateTime) {
      return value;
    }

    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      if (email != null) 'email': email,
      if (name != null) 'name': name,
      if (photoURL != null) 'photoURL': photoURL,
      if (mobile != null) 'mobile': mobile,
      'addresses': addresses.map((a) => a.toJson()).toList(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  /// Returns user data for database logs (minimal info)
  Map<String, dynamic> getUserForDbLogs() {
    return {
      'uid': uid,
      if (email != null) 'email': email,
      if (name != null) 'name': name,
      if (mobile != null) 'mobile': mobile,
    };
  }

  User copyWith({
    String? uid,
    String? email,
    String? name,
    String? photoURL,
    String? mobile,
    List<UserAddress>? addresses,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      name: name ?? this.name,
      photoURL: photoURL ?? this.photoURL,
      mobile: mobile ?? this.mobile,
      addresses: addresses ?? this.addresses,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    uid,
    email,
    name,
    photoURL,
    mobile,
    addresses,
    createdAt,
    updatedAt,
  ];
}
