# workern_widgets

Shared UI widgets for Workern apps.

## Widgets

### LocationSearchField

A reusable location search field using Google Places API.

**Usage:**

```dart
import 'package:workern_widgets/workern_widgets.dart';

LocationSearchField(
  googleApiKey: 'YOUR_API_KEY',
  onPlaceSelected: (prediction) {
    print('Selected: ${prediction.description}');
    print('Lat: ${prediction.lat}, Lng: ${prediction.lng}');
  },
  latitude: currentLatitude,
  longitude: currentLongitude,
  hintText: 'Search for area, street name...',
  primaryColor: Colors.blue,
)
```

**Parameters:**

- `googleApiKey` (required): Google Places API key
- `onPlaceSelected` (required): Callback when a place is selected
- `latitude`: Current user latitude for nearby results
- `longitude`: Current user longitude for nearby results
- `hintText`: Placeholder text (default: 'Search for area, street name...')
- `showAsAppBarSearch`: Whether to show as app bar search (default: false)
- `primaryColor`: Primary color for the icon (default: Theme primary color)
- `placeType`: Type of place to search for (default: null - shows all types)
  - Available values: 'geocode', 'address', 'establishment', '(region)', '(cities)'
