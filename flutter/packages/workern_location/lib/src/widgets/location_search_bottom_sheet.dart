import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:skeletonizer/skeletonizer.dart';
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

  List<String> _recentSearches = [];
  static const String _recentSearchesKey = 'location_recent_searches';
  static const int _maxRecentSearches = 10;

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _recentSearches = prefs.getStringList(_recentSearchesKey) ?? [];
      });
    }
  }

  Future<void> _saveSearch(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getStringList(_recentSearchesKey) ?? [];
    current.remove(trimmed);
    current.insert(0, trimmed);
    final trimmedList = current.take(_maxRecentSearches).toList();
    await prefs.setStringList(_recentSearchesKey, trimmedList);
    _loadRecentSearches();
  }

  Future<void> _removeSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getStringList(_recentSearchesKey) ?? [];
    current.remove(query.trim());
    await prefs.setStringList(_recentSearchesKey, current);
    _loadRecentSearches();
  }

  Future<void> _clearAllRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentSearchesKey);
    if (mounted) {
      setState(() {
        _recentSearches = [];
      });
    }
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

  Widget _buildShimmerLoading(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ListView.separated(
      itemCount: 5,
      separatorBuilder: (_, __) => const ShadSeparator.horizontal(
        margin: EdgeInsets.only(left: 68),
      ),
      itemBuilder: (context, index) {
        return Skeletonizer(
          enabled: true,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Colors.grey,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 180,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.grey,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: 240,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.grey,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: widget.primaryColor.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.location_on_outlined,
                size: 38,
                color: widget.primaryColor.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Search for a location',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Find address, landmarks, city...',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: theme.colorScheme.mutedForeground.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsState(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: theme.colorScheme.muted.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.location_off_outlined,
                size: 38,
                color: theme.colorScheme.mutedForeground.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No results found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your keywords or spelling',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: theme.colorScheme.mutedForeground.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSearchesSection(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'RECENT SEARCHES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                  color: theme.colorScheme.mutedForeground.withValues(alpha: 0.8),
                ),
              ),
              GestureDetector(
                onTap: _clearAllRecentSearches,
                child: Text(
                  'Clear all',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: widget.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _recentSearches.length,
          separatorBuilder: (_, __) => const ShadSeparator.horizontal(
            margin: EdgeInsets.only(left: 68),
          ),
          itemBuilder: (context, index) {
            final query = _recentSearches[index];
            return ListTile(
              dense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: theme.colorScheme.muted.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.history_rounded,
                  size: 18,
                  color: theme.colorScheme.mutedForeground,
                ),
              ),
              title: Text(
                query,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              trailing: IconButton(
                icon: Icon(
                  Icons.close_rounded,
                  size: 16,
                  color: theme.colorScheme.mutedForeground,
                ),
                onPressed: () => _removeSearch(query),
              ),
              onTap: () {
                _searchController.text = query;
                _searchController.selection = TextSelection.fromPosition(
                  TextSelection.fromPosition(TextPosition(offset: query.length)).base,
                );
                _searchPlaces(query);
              },
            );
          },
        ),
      ],
    );
  }

  Widget _buildPredictionsList(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ListView.separated(
      itemCount: _predictions.length,
      separatorBuilder: (_, __) => const ShadSeparator.horizontal(
        margin: EdgeInsets.only(left: 68),
      ),
      itemBuilder: (context, index) {
        final place = _predictions[index];
        return InkWell(
          onTap: () {
            final selectedText = place['mainText'] ?? place['description'] ?? '';
            if (selectedText.isNotEmpty) {
              _saveSearch(selectedText);
            }
            Navigator.pop(context, {
              'placeId': place['placeId'],
              'description': place['description'],
              'mainText': place['mainText'],
              'secondaryText': place['secondaryText'],
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: widget.primaryColor.withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.location_on_outlined,
                    color: widget.primaryColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        place['mainText'] ?? place['description'],
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      if (place['secondaryText'] != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          place['secondaryText'],
                          style: TextStyle(
                            fontSize: 13,
                            color: theme.colorScheme.mutedForeground.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final bgColor = theme.colorScheme.background;
    return Material(
      color: bgColor,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: Container(
        height: double.infinity,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.15),
                        ),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Theme.of(context).colorScheme.shadow.withValues(alpha: 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        autofocus: true,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        textInputAction: TextInputAction.search,
                        onChanged: _searchPlaces,
                        decoration: InputDecoration(
                          hintText: 'Search location...',
                          hintStyle: TextStyle(
                            fontSize: 15,
                            color: theme.colorScheme.mutedForeground.withValues(alpha: 0.7),
                            fontWeight: FontWeight.w400,
                          ),
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            size: 20,
                            color: theme.colorScheme.mutedForeground,
                          ),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? GestureDetector(
                                  onTap: () {
                                    _searchController.clear();
                                    setState(() => _predictions = []);
                                  },
                                  child: Icon(
                                    Icons.cancel_rounded,
                                    size: 20,
                                    color: theme.colorScheme.mutedForeground.withValues(alpha: 0.7),
                                  ),
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const ShadSeparator.horizontal(),

            // Results
            Expanded(
              child: _isLoading
                  ? _buildShimmerLoading(context)
                  : _searchController.text.isEmpty
                      ? (_recentSearches.isEmpty
                          ? _buildEmptyState(context)
                          : _buildRecentSearchesSection(context))
                      : (_predictions.isEmpty
                          ? _buildNoResultsState(context)
                          : _buildPredictionsList(context)),
            ),
          ],
        ),
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
