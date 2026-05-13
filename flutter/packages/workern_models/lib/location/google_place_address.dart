import '../user/address.dart';
import 'coordinates.dart';
import 'google_place.dart';

/// Shop Address Google Info

/// Shop Address model - extends base Address with shop-specific Google info
class GooglePlaceAddress extends Address {
  final GooglePlace google;

  GooglePlaceAddress({
    required super.street,
    required super.city,
    required super.state,
    required super.postalCode,
    required super.formatted,
    required super.country,
    required super.coordinates,
    required this.google,
  });

  factory GooglePlaceAddress.fromJson(Map<String, dynamic> json) {
    try {
      return GooglePlaceAddress(
        formatted: _safeString(json['formatted']),
        street: _safeString(json['street']),
        city: _safeString(json['city']),
        state: _safeString(json['state']),
        postalCode: _safeString(json['postalCode']),
        country: _safeString(json['country'], 'India'),
        coordinates:
            json['coordinates'] != null &&
                json['coordinates'] is Map<String, dynamic>
            ? Coordinates.fromJson(json['coordinates'] as Map<String, dynamic>)
            : const Coordinates(lat: 0, lng: 0, geoHash: ''),
        google: json['google'] != null && json['google'] is Map<String, dynamic>
            ? GooglePlace.fromJson(json['google'] as Map<String, dynamic>)
            : GooglePlace(),
      );
    } catch (e) {
      // Return default address on parsing error
      return GooglePlaceAddress(
        formatted: 'N/A',
        street: 'N/A',
        city: 'N/A',
        state: 'N/A',
        postalCode: 'N/A',
        country: 'India',
        coordinates: const Coordinates(lat: 0, lng: 0, geoHash: ''),
        google: GooglePlace(),
      );
    }
  }

  @override
  Map<String, dynamic> toJson() => {
    'formatted': formatted,
    if (street.isNotEmpty) 'street': street,
    if (city.isNotEmpty) 'city': city,
    if (state.isNotEmpty) 'state': state,
    if (postalCode.isNotEmpty) 'postalCode': postalCode,
    if (country.isNotEmpty) 'country': country,
    'coordinates': coordinates.toJson(),
    'google': google.toJson(),
  };

  static String _safeString(dynamic value, [String defaultValue = 'N/A']) {
    if (value == null) return defaultValue;
    final str = value.toString().trim();
    return str.isEmpty ? defaultValue : str;
  }
}
