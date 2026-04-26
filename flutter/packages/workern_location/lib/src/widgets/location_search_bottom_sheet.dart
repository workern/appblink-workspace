import 'package:flutter/material.dart';
import 'package:workern_widgets/workern_widgets.dart';
import '../services/places_service.dart';

/// A bottom sheet widget for searching and selecting locations
/// Uses Google Places Autocomplete API
class LocationSearchBottomSheet extends StatefulWidget {
  final String apiKey;
  final double? userLatitude;
  final double? userLongitude;
  final Color primaryColor;

  const LocationSearchBottomSheet({
    super.key,
    required this.apiKey,
    this.userLatitude,
    this.userLongitude,
    this.primaryColor = const Color(0xFFFF5252),
  });

  @override
  State<LocationSearchBottomSheet> createState() =>
      _LocationSearchBottomSheetState();
}

class _LocationSearchBottomSheetState extends State<LocationSearchBottomSheet> {
  final TextEditingController _searchController = TextEditingController();
  final PlacesService _placesService = PlacesService();
  List<Map<String, dynamic>> _predictions = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchPlaces(String query) async {
    if (query.isEmpty) {
      setState(() {
        _predictions = [];
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final results = await _placesService.searchPlaces(
      query: query,
      apiKey: widget.apiKey,
      latitude: widget.userLatitude,
      longitude: widget.userLongitude,
      radiusMeters: 50000, // 50km radius
    );

    if (mounted) {
      setState(() {
        _predictions = results;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    // Calculate height: 50% of screen height when keyboard is visible
    // This keeps the bottom sheet at a reasonable size as shown in the UI
    final sheetHeight = screenHeight * 0.60;

    return Container(
      height: sheetHeight,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                Expanded(
                  child: WorkernTextField(
                    label: '',
                    controller: _searchController,
                    hint: 'Search...',
                    primaryColor: widget.primaryColor,
                    autofocus: true,
                    onChanged: (value) {
                      _searchPlaces(value);
                    },
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    icon: Icon(Icons.close, color: Colors.grey[600]),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _predictions = [];
                      });
                    },
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Results
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _predictions.isEmpty && _searchController.text.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search,
                                size: 64, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text(
                              'Search for a location',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : _predictions.isEmpty
                        ? Center(
                            child: Text(
                              'No results found',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          )
                        : ListView.separated(
                            itemCount: _predictions.length,
                            separatorBuilder: (context, index) => const Divider(
                              height: 1,
                              indent: 72,
                            ),
                            itemBuilder: (context, index) {
                              final place = _predictions[index];
                              return ListTile(
                                leading: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.location_on_outlined,
                                    color: Colors.grey[600],
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  place['mainText'] ?? place['description'],
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                subtitle: place['secondaryText'] != null
                                    ? Text(
                                        place['secondaryText'],
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      )
                                    : null,
                                onTap: () {
                                  Navigator.pop(context, {
                                    'placeId': place['placeId'],
                                    'description': place['description'],
                                    'mainText': place['mainText'],
                                    'secondaryText': place['secondaryText'],
                                  });
                                },
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

/// Show the location search bottom sheet
/// Returns a map with placeId and description if a place is selected
Future<Map<String, dynamic>?> showLocationSearchBottomSheet({
  required BuildContext context,
  required String apiKey,
  double? userLatitude,
  double? userLongitude,
  Color primaryColor = const Color(0xFFFF5252),
}) async {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    useSafeArea: true,
    builder: (context) => LocationSearchBottomSheet(
      apiKey: apiKey,
      userLatitude: userLatitude,
      userLongitude: userLongitude,
      primaryColor: primaryColor,
    ),
  );
}
