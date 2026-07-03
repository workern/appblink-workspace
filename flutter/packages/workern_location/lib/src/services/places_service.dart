import 'package:flutter/foundation.dart';
import 'package:flutter_google_places_sdk/flutter_google_places_sdk.dart';
import 'package:geocoding/geocoding.dart';
import 'location_service.dart';

/// Service for Google Places (autocomplete + place details) and geocoding.
///
/// Everything goes through native SDKs — zero HTTP calls:
/// - Autocomplete / Place Details → [FlutterGooglePlacesSdk] (native iOS/Android Places SDK)
///   Works with iOS bundle-ID-restricted API keys.
/// - Reverse / Forward geocoding   → [geocoding] package (native device geocoder, no API key)
class PlacesService {
  // ── Native SDK instance ───────────────────────────────────────────────────

  FlutterGooglePlacesSdk _sdk(String apiKey) => FlutterGooglePlacesSdk(apiKey);

  // ── Autocomplete ──────────────────────────────────────────────────────────

  /// Search for places using the native Google Places Autocomplete SDK.
  ///
  /// Returns a list of predictions with keys:
  ///   `placeId`, `description`, `mainText`, `secondaryText`
  ///
  /// If [fields] is provided, place details are fetched and merged under `'details'`.
  Future<List<Map<String, dynamic>>> searchPlaces({
    required String query,
    required String apiKey,
    double? latitude,
    double? longitude,
    int? radiusMeters,
    List<String>? fields,
  }) async {
    try {
      debugPrint('🔍 Searching places (native SDK) for: $query');

      final sdk = _sdk(apiKey);

      // Build optional location bias rectangle
      LatLngBounds? locationBias;
      if (latitude != null && longitude != null) {
        final delta = ((radiusMeters ?? 50000) / 111_000.0);
        locationBias = LatLngBounds(
          southwest: LatLng(lat: latitude - delta, lng: longitude - delta),
          northeast: LatLng(lat: latitude + delta, lng: longitude + delta),
        );
      }

      final response = await sdk.findAutocompletePredictions(
        query,
        locationBias: locationBias,
      );

      debugPrint('✅ Found ${response.predictions.length} places');

      final results = response.predictions.map((p) {
        return <String, dynamic>{
          'placeId': p.placeId,
          'description': p.fullText,
          'mainText': p.primaryText,
          'secondaryText': p.secondaryText,
        };
      }).toList();

      // Optionally fetch details for each prediction
      if (fields != null && fields.isNotEmpty) {
        final detailed = await Future.wait(
          results.map((place) async {
            final details = await fetchPlaceDetails(
              place['placeId'] as String,
              apiKey,
              fields: fields,
            );
            return details != null ? {...place, 'details': details} : place;
          }),
        );
        return detailed;
      }

      return results;
    } catch (e) {
      debugPrint('❌ Error searching places (native SDK): $e');
      return [];
    }
  }

  // ── Place Details ─────────────────────────────────────────────────────────

  /// Fetch detailed information about a place using the native Places SDK.
  ///
  /// Returns a map that mirrors the shape of the old Places REST API response
  /// so all existing callers continue to work without changes.
  static Future<Map<String, dynamic>?> fetchPlaceDetails(
    String placeId,
    String googleApiKey, {
    List<String>? fields,
  }) async {
    try {
      final sdk = FlutterGooglePlacesSdk(googleApiKey);
      final placeFields = _mapToPlaceFields(fields);

      final response = await sdk.fetchPlace(placeId, fields: placeFields);
      final place = response.place;
      if (place == null) return null;

      final result = <String, dynamic>{'place_id': placeId};

      if (place.name != null) result['name'] = place.name;
      if (place.address != null) result['formatted_address'] = place.address;
      if (place.websiteUri != null) result['url'] = place.websiteUri.toString();
      if (place.phoneNumber != null) {
        result['formatted_phone_number'] = place.phoneNumber;
      }
      if (place.rating != null) result['rating'] = place.rating;

      // geometry.location — mirrors REST API shape
      final latLng = place.latLng;
      if (latLng != null) {
        result['geometry'] = {
          'location': {'lat': latLng.lat, 'lng': latLng.lng},
        };
      }

      // address_components — mirrors REST API shape
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

      // photos — photo_reference mirrors REST shape
      if (place.photoMetadatas != null && place.photoMetadatas!.isNotEmpty) {
        result['photos'] = place.photoMetadatas!
            .map((m) => {'photo_reference': m.photoReference})
            .toList();
      }

      return result;
    } catch (e) {
      debugPrint('❌ Error fetching place details (native SDK): $e');
      return null;
    }
  }

  /// Maps string field names (old HTTP API convention) → [PlaceField] enum.
  static List<PlaceField> _mapToPlaceFields(List<String>? fields) {
    if (fields == null || fields.isEmpty) {
      return [PlaceField.Id, PlaceField.Name, PlaceField.Address, PlaceField.Location];
    }
    final mapped = <PlaceField>{PlaceField.Id};
    for (final f in fields) {
      switch (f.toLowerCase()) {
        case 'place_id':
        case 'id':
          mapped.add(PlaceField.Id);
        case 'name':
        case 'display_name':
          mapped.add(PlaceField.Name);
        case 'formatted_address':
        case 'address':
          mapped.add(PlaceField.Address);
        case 'geometry':
        case 'latlng':
        case 'location':
          mapped.add(PlaceField.Location);
        case 'photos':
          mapped.add(PlaceField.PhotoMetadatas);
        case 'phone_number':
        case 'formatted_phone_number':
          mapped.add(PlaceField.PhoneNumber);
        case 'website_uri':
        case 'url':
          mapped.add(PlaceField.WebsiteUri);
        case 'address_components':
          mapped.add(PlaceField.AddressComponents);
        case 'rating':
          mapped.add(PlaceField.Rating);
        case 'types':
          mapped.add(PlaceField.Types);
      }
    }
    return mapped.toList();
  }

  // ── Reverse Geocoding (native device geocoder — no API key needed) ─────────

  /// Reverse geocode coordinates to address components using the device's
  /// native geocoding service. No API key, no HTTP, no quotas.
  ///
  /// Returns a map with: street, city, state, postalCode, area, subLocality.
  Future<Map<String, String?>> reverseGeocode({
    required double latitude,
    required double longitude,
    required String apiKey, // kept for API compatibility, not used
  }) async {
    try {
      debugPrint('🔄 Reverse geocoding (native): $latitude, $longitude');

      final placemarks = await placemarkFromCoordinates(latitude, longitude);

      if (placemarks.isEmpty) {
        debugPrint('⚠️ No placemarks from native reverse geocoding');
        return _emptyAddress();
      }

      final p = placemarks.first;
      debugPrint('📦 Placemark: $p');

      final street = [p.name, p.street]
          .where((s) => s != null && s.isNotEmpty && s != p.locality)
          .join(', ')
          .trim();

      final result = {
        'street': street.isNotEmpty ? street : p.thoroughfare,
        'city': p.locality ?? p.administrativeArea,
        'state': p.administrativeArea,
        'postalCode': p.postalCode,
        'area': p.subLocality ?? p.subAdministrativeArea,
        'subLocality': p.subLocality,
      };

      debugPrint('✅ Reverse geocoded: $result');
      return result;
    } catch (e) {
      debugPrint('❌ Error reverse geocoding (native): $e');
      return _emptyAddress();
    }
  }

  static Map<String, String?> _emptyAddress() => {
    'street': null,
    'city': null,
    'state': null,
    'postalCode': null,
    'area': null,
    'subLocality': null,
  };

  // ── Reverse geocode current location ──────────────────────────────────────

  /// Convenience: get current GPS position then reverse geocode it natively.
  ///
  /// Throws [LocationException] if location permission is denied.
  Future<Map<String, dynamic>> reverseGeocodeCurrentLocation({
    required String apiKey,
  }) async {
    debugPrint('📍 Getting current location for reverse geocoding');
    final locationService = LocationService();
    final position = await locationService.getCurrentPosition();
    debugPrint('📍 Got position: ${position.latitude}, ${position.longitude}');

    final addressDetails = await reverseGeocode(
      latitude: position.latitude,
      longitude: position.longitude,
      apiKey: apiKey,
    );

    return {'position': position, 'address': addressDetails};
  }

  // ── Forward Geocoding (native device geocoder — no API key needed) ─────────

  /// Forward geocode an address to coordinates using the device's native
  /// geocoding service. No API key, no HTTP, no quotas.
  ///
  /// Returns `null` if no result is found.
  Future<Map<String, double>?> forwardGeocode({
    required String apiKey, // kept for API compatibility, not used
    String? street,
    String? city,
    String? state,
    String? postalCode,
    String? country,
  }) async {
    final parts = [
      if (street?.isNotEmpty == true) street,
      if (city?.isNotEmpty == true) city,
      if (state?.isNotEmpty == true) state,
      if (postalCode?.isNotEmpty == true) postalCode,
      if (country?.isNotEmpty == true) country,
    ];

    if (parts.isEmpty) return null;

    final address = parts.join(', ');
    debugPrint('🔍 Forward geocoding (native): $address');

    try {
      final locations = await locationFromAddress(address);
      if (locations.isNotEmpty) {
        final loc = locations.first;
        debugPrint('✅ Forward geocoded to: ${loc.latitude}, ${loc.longitude}');
        return {'lat': loc.latitude, 'lng': loc.longitude};
      }
      debugPrint('⚠️ Forward geocode returned no results');
    } catch (e) {
      debugPrint('❌ Error forward geocoding (native): $e');
    }
    return null;
  }
}
