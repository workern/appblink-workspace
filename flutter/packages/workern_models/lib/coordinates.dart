import 'package:equatable/equatable.dart';

/// Represents geolocation coordinates with geoHash support
class Coordinates extends Equatable {
  final double lat;
  final double lng;
  final String? geoHash;

  const Coordinates({required this.lat, required this.lng, this.geoHash});

  /// Convenience getters for latitude/longitude naming convention
  double get latitude => lat;
  double get longitude => lng;

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      lat: (json['lat'] as num? ?? json['latitude'] as num? ?? 0.0).toDouble(),
      lng: (json['lng'] as num? ?? json['longitude'] as num? ?? 0.0).toDouble(),
      geoHash: json['geoHash'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'lat': lat, 'lng': lng, if (geoHash != null) 'geoHash': geoHash};
  }

  Coordinates copyWith({double? lat, double? lng, String? geoHash}) {
    return Coordinates(
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      geoHash: geoHash ?? this.geoHash,
    );
  }

  @override
  List<Object?> get props => [lat, lng, geoHash];
}
