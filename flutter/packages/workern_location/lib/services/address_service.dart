import 'package:flutter/foundation.dart';
import 'package:flutter_google_places_sdk/flutter_google_places_sdk.dart';

/// Service for address-related operations including Google Places integration.
class AddressService {
  /// Generate a geohash from latitude and longitude coordinates.
  /// Simple precision geohash (first 8 chars).
  static String generateGeohash(double latitude, double longitude) {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    double minLat = -90.0, maxLat = 90.0;
    double minLng = -180.0, maxLng = 180.0;
    String hash = '';
    int bits = 0;
    int bit = 0;

    for (int i = 0; i < 8; i++) {
      for (int j = 0; j < 5; j++) {
        if (bit % 2 == 0) {
          double mid = (minLng + maxLng) / 2;
          if (longitude > mid) {
            bits |= (1 << (4 - j));
            minLng = mid;
          } else {
            maxLng = mid;
          }
        } else {
          double mid = (minLat + maxLat) / 2;
          if (latitude > mid) {
            bits |= (1 << (4 - j));
            minLat = mid;
          } else {
            maxLat = mid;
          }
        }
        bit++;
      }
      hash += base32[bits];
      bits = 0;
    }
    return hash;
  }

  /// Fetch detailed information about a place using the native Places SDK.
  ///
  /// Returns a map that mirrors the old Places REST API shape so all existing
  /// callers (address_components, geometry.location, etc.) continue to work.
  static Future<Map<String, dynamic>?> fetchPlaceDetails(
    String placeId,
    String googleApiKey,
  ) async {
    try {
      final sdk = FlutterGooglePlacesSdk(googleApiKey);
      final response = await sdk.fetchPlace(
        placeId,
        fields: [
          PlaceField.Id,
          PlaceField.Name,
          PlaceField.Address,
          PlaceField.Location,
          PlaceField.AddressComponents,
          PlaceField.WebsiteUri,
          PlaceField.PhoneNumber,
          PlaceField.Types,
        ],
      );

      final place = response.place;
      if (place == null) return null;

      final result = <String, dynamic>{'place_id': placeId};

      if (place.name != null) result['name'] = place.name;
      if (place.address != null) result['formatted_address'] = place.address;
      if (place.websiteUri != null) {
        result['url'] = place.websiteUri.toString();
      }
      if (place.phoneNumber != null) {
        result['formatted_phone_number'] = place.phoneNumber;
      }

      final latLng = place.latLng;
      if (latLng != null) {
        result['geometry'] = {
          'location': {'lat': latLng.lat, 'lng': latLng.lng},
        };
      }

      if (place.addressComponents != null) {
        result['address_components'] = place.addressComponents!
            .map(
              (c) => {
                'long_name': c.name,
                'short_name': c.shortName,
                'types': c.types.map((t) => t.toString()).toList(),
              },
            )
            .toList();
      }

      return result;
    } catch (e) {
      debugPrint('❌ Error fetching place details (native SDK): $e');
      return null;
    }
  }

  /// Parse address components from a Google Place Details response map.
  /// Works with both native SDK and legacy REST API response shapes.
  ///
  /// Returns a map with keys: street, city, state, postalCode, country.
  static Map<String, String> parseAddressComponents(
    List<dynamic> components,
  ) {
    final Map<String, String> parsed = {
      'street': '',
      'city': '',
      'state': '',
      'postalCode': '',
      'country': '',
    };

    String streetNumber = '';
    String route = '';

    for (var component in components) {
      final types = List<String>.from(component['types'] ?? []);
      final longName = (component['long_name'] ?? '') as String;

      if (types.contains('street_number') ||
          types.contains('sublocality_level_2')) {
        streetNumber = longName;
      } else if (types.contains('route')) {
        route = longName;
      } else if (types.contains('locality')) {
        parsed['city'] = longName;
      } else if (types.contains('administrative_area_level_1')) {
        parsed['state'] = longName;
      } else if (types.contains('postal_code')) {
        parsed['postalCode'] = longName;
      } else if (types.contains('country')) {
        parsed['country'] = longName;
      }
    }

    if (streetNumber.isNotEmpty && route.isNotEmpty) {
      parsed['street'] = '$streetNumber $route';
    } else if (route.isNotEmpty) {
      parsed['street'] = route;
    } else if (streetNumber.isNotEmpty) {
      parsed['street'] = streetNumber;
    }

    return parsed;
  }

  /// Build a formatted address string from individual components.
  static String buildFormattedAddress({
    required String street,
    required String city,
    required String state,
    required String postalCode,
    required String country,
  }) {
    final parts = <String>[];
    if (street.isNotEmpty) parts.add(street);
    if (city.isNotEmpty) parts.add(city);
    if (state.isNotEmpty) parts.add(state);
    if (postalCode.isNotEmpty) parts.add(postalCode);
    if (country.isNotEmpty) parts.add(country);
    return parts.join(', ');
  }

  /// Extract coordinates from a place details map.
  /// Returns `{lat, lng}` or `null` if not available.
  static Map<String, double>? extractCoordinates(
    Map<String, dynamic> placeDetails,
  ) {
    try {
      final geometry = placeDetails['geometry'] as Map<String, dynamic>?;
      final location = geometry?['location'] as Map<String, dynamic>?;
      final lat = location?['lat'] as double?;
      final lng = location?['lng'] as double?;
      if (lat != null && lng != null) return {'lat': lat, 'lng': lng};
    } catch (e) {
      debugPrint('❌ Error extracting coordinates: $e');
    }
    return null;
  }

  /// Extract Google Maps info from place details.
  /// Returns `{placeId, mapsLink}`.
  static Map<String, String> extractGoogleInfo(
    Map<String, dynamic> placeDetails,
    String placeId,
  ) {
    final geometry = placeDetails['geometry'] as Map<String, dynamic>?;
    final location = geometry?['location'] as Map<String, dynamic>?;
    final lat = location?['lat'] ?? 0.0;
    final lng = location?['lng'] ?? 0.0;
    return {
      'placeId': placeId,
      'mapsLink': 'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
    };
  }
}
