import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert' as convert;
import 'location_service.dart';

class PlacesService {
  /// Search for places using Google Places Autocomplete API
  ///
  /// Returns a list of place predictions with place_id, description, and distance
  /// If fields parameter is provided, fetches detailed place information for each result
  Future<List<Map<String, dynamic>>> searchPlaces({
    required String query,
    required String apiKey,
    double? latitude,
    double? longitude,
    int? radiusMeters,
    List<String>? fields,
  }) async {
    try {
      debugPrint('🔍 Searching places for: $query');

      var url =
          'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=$query&key=$apiKey';

      // Add location bias if coordinates provided
      if (latitude != null && longitude != null) {
        url += '&location=$latitude,$longitude';
        if (radiusMeters != null) {
          url += '&radius=$radiusMeters';
        }
      }

      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final predictions = data['predictions'] as List? ?? [];

        debugPrint('✅ Found ${predictions.length} places');

        List<Map<String, dynamic>> results = predictions.map((p) {
          return {
            'placeId': p['place_id'] as String,
            'description': p['description'] as String,
            'mainText': p['structured_formatting']?['main_text'] as String?,
            'secondaryText':
                p['structured_formatting']?['secondary_text'] as String?,
          };
        }).toList();

        // If fields are specified, fetch detailed information for each place
        if (fields != null && fields.isNotEmpty) {
          final detailedResults = await Future.wait(
            results.map((place) async {
              final placeId = place['placeId'] as String;
              final details =
                  await fetchPlaceDetails(placeId, apiKey, fields: fields);

              if (details != null) {
                // Merge autocomplete data with detailed data
                return {
                  ...place,
                  'details': details,
                };
              }
              return place;
            }),
          );

          return detailedResults;
        }

        return results;
      } else {
        debugPrint('❌ Failed to search places: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      debugPrint('❌ Error searching places: $e');
      return [];
    }
  }

  /// Fetch detailed information about a place from Google Places API
  ///
  /// Optional fields parameter specifies which fields to return (e.g., 'name', 'geometry', 'formatted_address')
  /// See: https://developers.google.com/maps/documentation/places/web-service/place-details#fields
  static Future<Map<String, dynamic>?> fetchPlaceDetails(
    String placeId,
    String googleApiKey, {
    List<String>? fields,
  }) async {
    try {
      var url =
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=$googleApiKey';

      // Add fields parameter if specified
      if (fields != null && fields.isNotEmpty) {
        final fieldsParam = fields.join(',');
        url += '&fields=$fieldsParam';
      }

      final response = await http.get(Uri.parse(url));

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

  /// Reverse geocode coordinates to get address components
  ///
  /// Returns a map with keys: street, city, state, postalCode, area, subLocality
  /// All values are nullable strings
  Future<Map<String, String?>> reverseGeocode({
    required double latitude,
    required double longitude,
    required String apiKey,
  }) async {
    try {
      debugPrint('🔄 Reverse geocoding: $latitude, $longitude');

      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/geocode/json?latlng=$latitude,$longitude&key=$apiKey',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final results = data['results'] as List? ?? [];

        if (results.isEmpty) {
          debugPrint('⚠️ No results from reverse geocoding');
          return {
            'street': null,
            'city': null,
            'state': null,
            'postalCode': null,
            'area': null,
            'subLocality': null,
          };
        }

        final result = results.first;
        final components = result['address_components'] as List? ?? [];

        debugPrint('📦 Raw address components: $components');

        // Extract components - map ALL types, not just the first one
        final Map<String, String> mapped = {};
        final Map<String, String> shortMapped = {};

        for (var c in components) {
          final types = c['types'] as List? ?? [];
          final longName = c['long_name'] as String?;
          final shortName = c['short_name'] as String?;

          for (var type in types) {
            if (longName != null) mapped[type] = longName;
            if (shortName != null) shortMapped[type] = shortName;
          }
        }

        debugPrint('🗺️ Mapped address components: $mapped');

        final street =
            (mapped['route'] != null && mapped['street_number'] != null)
                ? '${mapped['street_number']} ${mapped['route']}'
                : (mapped['route'] ?? mapped['sublocality'] ?? '');
        final city =
            mapped['locality'] ?? mapped['administrative_area_level_2'];
        final state = shortMapped['administrative_area_level_1'];
        final postalCode = mapped['postal_code'];
        final subLocality = mapped['sublocality'] ??
            mapped['sublocality_level_1'] ??
            mapped['sublocality_level_2'];
        final area = subLocality;

        debugPrint(
            '✅ Extracted - Street: $street, City: $city, State: $state, Postal Code: $postalCode, Area: $area, SubLocality: $subLocality');

        return {
          'street': street,
          'city': city,
          'state': state,
          'postalCode': postalCode,
          'area': area,
          'subLocality': subLocality,
        };
      } else {
        debugPrint('❌ Failed to reverse geocode: ${response.statusCode}');
        return {
          'street': null,
          'city': null,
          'state': null,
          'postalCode': null,
          'area': null,
          'subLocality': null,
        };
      }
    } catch (e) {
      debugPrint('❌ Error reverse geocoding: $e');
      return {
        'street': null,
        'city': null,
        'state': null,
        'postalCode': null,
        'area': null,
        'subLocality': null,
      };
    }
  }

  /// Reverse geocode the user's current location
  ///
  /// This is a convenience method that combines location fetching and reverse geocoding
  ///
  /// Throws [LocationException] if location cannot be obtained (no permission,
  /// service disabled, etc.) so callers can react with specific UI.
  /// Throws generic [Exception] for network/geocoding errors.
  Future<Map<String, dynamic>> reverseGeocodeCurrentLocation({
    required String apiKey,
  }) async {
    debugPrint('📍 Getting current location for reverse geocoding');

    final locationService = LocationService();
    // Let LocationException propagate — caller handles UI (open settings, etc.)
    final position = await locationService.getCurrentPosition();

    debugPrint('📍 Got position: ${position.latitude}, ${position.longitude}');

    // Reverse geocode the position
    final addressDetails = await reverseGeocode(
      latitude: position.latitude,
      longitude: position.longitude,
      apiKey: apiKey,
    );

    return {
      'position': position,
      'address': addressDetails,
    };
  }
}
