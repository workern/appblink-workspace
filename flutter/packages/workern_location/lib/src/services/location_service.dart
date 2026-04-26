import 'package:geolocator/geolocator.dart';
import 'package:flutter/foundation.dart';

/// Reason why getting location failed, used by callers to show appropriate UI.
enum LocationFailureReason {
  /// Device-level GPS / location service is turned off.
  serviceDisabled,

  /// Permission was denied (one-shot, user can be asked again).
  permissionDenied,

  /// Permission was permanently denied; user must open Settings.
  permissionDeniedForever,

  /// Unknown / unexpected error.
  unknown,
}

/// Thrown by [LocationService.getCurrentPosition] on failure so callers can
/// react with proper UI (e.g. open Settings, prompt to enable GPS).
class LocationException implements Exception {
  const LocationException(this.reason, [this.message]);
  final LocationFailureReason reason;
  final String? message;

  @override
  String toString() => 'LocationException($reason): $message';
}

class LocationService {
  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async =>
      Geolocator.isLocationServiceEnabled();

  /// Check location permission status
  Future<LocationPermission> checkPermission() async =>
      Geolocator.checkPermission();

  /// Request location permission
  Future<LocationPermission> requestPermission() async =>
      Geolocator.requestPermission();

  /// Get current position with error handling.
  ///
  /// Throws [LocationException] on failure so the caller can show the
  /// appropriate error UI or open system settings.
  Future<Position> getCurrentPosition() async {
    // Check if location services are enabled
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('⚠️ Location services are disabled');
      throw const LocationException(
        LocationFailureReason.serviceDisabled,
        'Location services are disabled. Please enable GPS.',
      );
    }

    // Check permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('⚠️ Location permissions are denied');
        throw const LocationException(
          LocationFailureReason.permissionDenied,
          'Location permission was denied.',
        );
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('⚠️ Location permissions are permanently denied');
      throw const LocationException(
        LocationFailureReason.permissionDeniedForever,
        'Location permission is permanently denied.',
      );
    }

    // Get current position (geolocator v14+ API)
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      debugPrint(
        '📍 Current location: ${position.latitude}, ${position.longitude}',
      );
      return position;
    } catch (e) {
      debugPrint('❌ Error getting location: $e');
      throw LocationException(
        LocationFailureReason.unknown,
        e.toString(),
      );
    }
  }

  /// Get last known position (faster but might be outdated)
  Future<Position?> getLastKnownPosition() async {
    try {
      return await Geolocator.getLastKnownPosition();
    } catch (e) {
      debugPrint('❌ Error getting last known position: $e');
      return null;
    }
  }

  /// Calculate distance between two points in meters
  double calculateDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }
}
