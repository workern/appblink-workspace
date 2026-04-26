import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = LocationService();

  Position? _currentPosition;
  bool _isLoading = false;
  String? _errorMessage;

  Position? get currentPosition => _currentPosition;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasLocation => _currentPosition != null;

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
      _isLoading = false;
      notifyListeners();
      return position;
    } on LocationException catch (e) {
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
