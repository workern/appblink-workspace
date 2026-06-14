import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = LocationService();

  Position? _currentPosition;
  bool _isLoading = false;
  String? _errorMessage;
  LocationFailureReason? _lastFailureReason;
  String? _currentLocationName;

  Position? get currentPosition => _currentPosition;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasLocation => _currentPosition != null;

  /// The reason the most recent [getCurrentLocation] call failed, or null if
  /// it succeeded. Useful for showing targeted error UI (e.g. link to Settings
  /// when permission is permanently denied).
  LocationFailureReason? get lastFailureReason => _lastFailureReason;

  /// Human-readable locality name obtained via reverse-geocoding the current
  /// position. Updated asynchronously after [getCurrentLocation] succeeds.
  /// Null until the first successful reverse-geocode.
  String? get currentLocationName => _currentLocationName;

  /// Get latitude from current position
  double? get latitude => _currentPosition?.latitude;

  /// Get longitude from current position
  double? get longitude => _currentPosition?.longitude;

  /// Get current location
  Future<Position?> getCurrentLocation() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Try to get last known position first (faster)
      final Position? lastKnown = await _locationService.getLastKnownPosition();
      if (lastKnown != null) {
        _currentPosition = lastKnown;
        notifyListeners();
      }

      // Get current position (throws LocationException on failure)
      final position = await _locationService.getCurrentPosition();
      _currentPosition = position;
      _lastFailureReason = null;
      _isLoading = false;
      notifyListeners();
      // Reverse-geocode asynchronously so it doesn't delay shop loading.
      _locationService
          .getLocalityName(position.latitude, position.longitude)
          .then((name) {
            if (name != null && name.isNotEmpty) {
              _currentLocationName = name;
              notifyListeners();
            }
          });
      return position;
    } on LocationException catch (e) {
      _lastFailureReason = e.reason;
      _errorMessage = e.message ?? 'Could not get location.';
      _isLoading = false;
      notifyListeners();
      return _currentPosition; // Return last known if available
    } catch (e) {
      _errorMessage = 'Error getting location: $e';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Request location permission
  Future<LocationPermission> requestPermission() async =>
      _locationService.requestPermission();

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async =>
      _locationService.isLocationServiceEnabled();

  /// Opens the device app-settings page so the user can grant location
  /// permission that was previously denied (permanently).
  Future<bool> openAppSettings() async => Geolocator.openAppSettings();

  /// Opens the device location-settings page so the user can enable GPS.
  Future<bool> openLocationSettings() async =>
      Geolocator.openLocationSettings();

  /// Refresh location
  Future<void> refreshLocation() async {
    await getCurrentLocation();
  }

  /// Calculate distance from current location to a point
  double? calculateDistance(double lat, double lng) {
    if (_currentPosition == null) return null;
    return _locationService.calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      lat,
      lng,
    );
  }
}
