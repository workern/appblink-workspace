# Workern Models Package

A shared package containing common data models and utilities for Workern Flutter applications.

## Features

- **Coordinates Model**: Unified geolocation model with latitude, longitude, and geoHash support
- **Serialization**: JSON serialization/deserialization support for all models
- **Immutability**: Value equality using Equatable
- **Copy Methods**: Easy model copying with modified fields

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  workern_models:
    path: ../../packages/workern_models
```

## Usage

### Coordinates

```dart
import 'package:workern_models/workern_models.dart';

// Create coordinates
final coords = Coordinates(
  latitude: 28.7041,
  longitude: 77.1025,
  geoHash: 'ttey4fg89', // optional
);

// Convert to JSON
final json = coords.toJson();

// From JSON (handles both 'latitude'/'longitude' and 'lat'/'lng' formats)
final coordsFromJson = Coordinates.fromJson(json);

// Copy with modifications
final modified = coords.copyWith(geoHash: 'new_hash');
```

## Model Reference

### Coordinates

Represents a geographic location with optional geohashing.

**Fields:**

- `latitude` (double): Latitude coordinate
- `longitude` (double): Longitude coordinate
- `geoHash` (String?, optional): Geohash string for spatial indexing

**Methods:**

- `toJson()`: Serialize to JSON
- `fromJson()`: Deserialize from JSON
- `copyWith()`: Create a copy with modified fields
