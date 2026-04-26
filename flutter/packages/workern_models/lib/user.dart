import 'coordinates.dart';

/// Matches User interface from libs/shared/models
class User {
  final String uid;
  final String? email;
  final String? name;
  final String? photoURL;
  final String? mobile;
  final List<UserAddress> addresses;

  User({
    required this.uid,
    this.email,
    this.name,
    this.photoURL,
    this.mobile,
    required this.addresses,
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      if (email != null) 'email': email,
      if (name != null) 'name': name,
      if (photoURL != null) 'photoURL': photoURL,
      if (mobile != null) 'mobile': mobile,
      'addresses': addresses.map((a) => a.toJson()).toList(),
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
}

/// User address with geolocation support
class UserAddress {
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

  UserAddress({
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

  String get fullAddress =>
      '$street, $city, $state $postalCode, ${country ?? 'India'}';
}
