# workern_utils

Utility functions and helpers for Workern Flutter applications.

## Features

- **Timestamp Utilities**: Convert various timestamp formats (Firestore Timestamp, ISO strings, objects with seconds/nanoseconds) to DateTime objects.

## Usage

```dart
import 'package:workern_utils/workern_utils.dart';

// Parse various timestamp formats
final date1 = parseTimestamp(firestoreTimestamp);
final date2 = parseTimestamp('2024-01-01T00:00:00.000Z');
final date3 = parseTimestamp({'seconds': 1704067200, 'nanoseconds': 0});
```
