import 'package:http/http.dart' as http;
import 'dart:convert' as convert;

/// Service for address-related operations including Google Places integration
class AddressService {
  /// Generate a geohash from latitude and longitude coordinates
  /// Simple precision geohash (first 8 chars)
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

  /// Fetch detailed information about a place from Google Places API
  static Future<Map<String, dynamic>?> fetchPlaceDetails(
    String placeId,
    String googleApiKey,
  ) async {
    try {
      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=$googleApiKey',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = convert.json.decode(response.body);
        if (data['status'] == 'OK') {
          return data['result'];
        }
      }
      return null;
    } catch (e) {
      print('Error fetching place details: $e');
      return null;
    }
  }

  /// Parse address components from Google Place Details response
  /// Returns a map with keys: street, city, state, postalCode, country
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
      final longName = component['long_name'] ?? '';

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

    // Combine street number and route
    if (streetNumber.isNotEmpty && route.isNotEmpty) {
      parsed['street'] = '$streetNumber $route';
    } else if (route.isNotEmpty) {
      parsed['street'] = route;
    } else if (streetNumber.isNotEmpty) {
      parsed['street'] = streetNumber;
    }

    return parsed;
  }

  /// Build formatted address string from components
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

  /// Extract coordinates from Google Place Details
  /// Returns {lat, lng} or null if not available
  static Map<String, double>? extractCoordinates(
    Map<String, dynamic> placeDetails,
  ) {
    try {
      final geometry = placeDetails['geometry'] as Map<String, dynamic>?;
      final location = geometry?['location'] as Map<String, dynamic>?;

      final lat = location?['lat'] as double?;
      final lng = location?['lng'] as double?;

      if (lat != null && lng != null) {
        return {'lat': lat, 'lng': lng};
      }
    } catch (e) {
      print('Error extracting coordinates: $e');
    }
    return null;
  }

  /// Extract Google Maps information from place details
  /// Returns {placeId, mapsLink} or defaults if not available
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
