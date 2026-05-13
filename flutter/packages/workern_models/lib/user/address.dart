import '../location/coordinates.dart';

/// Base Address model with common address fields shared across app
abstract class Address {
  final String street;
  final String city;
  final String state;
  final String postalCode;
  final String formatted;
  final String country;
  final Coordinates coordinates;
  Address({
    required this.street,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.formatted,
    required this.country,
    required this.coordinates,
  });

  Map<String, dynamic> toJson();
}
