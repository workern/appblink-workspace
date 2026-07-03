import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../services/places_service.dart';

/// A drop-in location search bar that uses Flutter's native [SearchAnchor] +
/// [SearchBar] — the same pattern as the Save Nest saves screen.
///
/// Features:
/// - Recent search history (persisted via SharedPreferences)
/// - Skeleton shimmer while the Places API call is in-flight
/// - Google Places Autocomplete results with "mainText / secondaryText" layout
/// - Per-instance debounce so rapid keystrokes don't hammer the API
///
/// Usage:
/// ```dart
/// WorkernLocationSearchBar(
///   apiKey: ApiKeys.getGooglePlacesApiKey(),
///   placeholder: 'Search delivery location...',
///   primaryColor: AppColors.primary,
///   userLatitude: locationProvider.latitude,
///   userLongitude: locationProvider.longitude,
///   onPlaceSelected: (result) async {
///     // result has: placeId, description, mainText, secondaryText
///     final details = await PlacesService.fetchPlaceDetails(result['placeId'], apiKey, fields: ['geometry']);
///     // ... use details
///   },
/// )
/// ```
class WorkernLocationSearchBar extends StatefulWidget {
  const WorkernLocationSearchBar({
    super.key,
    required this.apiKey,
    required this.onPlaceSelected,
    this.placeholder = 'Search location...',
    this.primaryColor,
    this.userLatitude,
    this.userLongitude,
    this.radiusMeters = 50000,
    this.recentSearchesKey = 'location_recent_searches',
    this.maxRecentSearches = 10,
    this.debounceMs = 350,
  });

  final String apiKey;

  /// Called when the user taps a place from the suggestions list.
  /// The map contains: `placeId`, `description`, `mainText`, `secondaryText`.
  final void Function(Map<String, dynamic> result) onPlaceSelected;

  final String placeholder;

  /// Accent colour used for the location pin icons and "Clear all" text.
  /// Defaults to the theme's primary colour.
  final Color? primaryColor;

  final double? userLatitude;
  final double? userLongitude;

  /// Radius passed to Places Autocomplete for location-biased results.
  final int radiusMeters;

  /// SharedPreferences key for persisting recent searches.
  final String recentSearchesKey;
  final int maxRecentSearches;

  /// Debounce delay in milliseconds before firing the Places API call.
  final int debounceMs;

  @override
  State<WorkernLocationSearchBar> createState() =>
      _WorkernLocationSearchBarState();
}

class _SuggestionsNotifier extends ChangeNotifier {
  void rebuild() => notifyListeners();
}

class _WorkernLocationSearchBarState extends State<WorkernLocationSearchBar> {
  final SearchController _searchController = SearchController();
  final PlacesService _placesService = PlacesService();
  final _SuggestionsNotifier _suggestionsNotifier = _SuggestionsNotifier();

  // ── State ─────────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> _results = [];
  bool _isLoading = false;
  List<String> _recentSearches = [];

  // Debounce
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _suggestionsNotifier.dispose();
    super.dispose();
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _recentSearches =
            prefs.getStringList(widget.recentSearchesKey) ?? [];
      });
    }
  }

  Future<void> _saveRecentSearch(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(widget.recentSearchesKey) ?? [];
    list.remove(trimmed);
    list.insert(0, trimmed);
    await prefs.setStringList(
      widget.recentSearchesKey,
      list.take(widget.maxRecentSearches).toList(),
    );
    await _loadRecentSearches();
  }

  Future<void> _removeRecentSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(widget.recentSearchesKey) ?? [];
    list.remove(query.trim());
    await prefs.setStringList(widget.recentSearchesKey, list);
    await _loadRecentSearches();
    _suggestionsNotifier.rebuild();
  }

  Future<void> _clearAllRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(widget.recentSearchesKey);
    if (mounted) setState(() => _recentSearches = []);
    _suggestionsNotifier.rebuild();
  }

  // ── Search ────────────────────────────────────────────────────────────────

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    if (value.trim().isEmpty) {
      if (mounted) {
        setState(() {
          _results = [];
          _isLoading = false;
        });
      }
      // No _rebuildSuggestions() here — viewOnChanged already triggers
      // suggestionsBuilder to re-run on every keystroke.
      return;
    }

    if (mounted) setState(() => _isLoading = true);
    // Do NOT call _rebuildSuggestions() here — it prepends a zero-width-space
    // which corrupts the cursor position mid-keystroke. The suggestionsBuilder
    // is already re-invoked by viewOnChanged automatically.

    _debounce = Timer(Duration(milliseconds: widget.debounceMs), () async {
      if (!mounted) return;
      try {
        final results = await _placesService.searchPlaces(
          query: value.trim(),
          apiKey: widget.apiKey,
          latitude: widget.userLatitude,
          longitude: widget.userLongitude,
          radiusMeters: widget.radiusMeters,
        );
        if (mounted) {
          setState(() {
            _results = results;
            _isLoading = false;
          });
          _suggestionsNotifier.rebuild();
        }
      } catch (e) {
        debugPrint('❌ WorkernLocationSearchBar places error: $e');
        if (mounted) setState(() => _isLoading = false);
      }
    });
  }

  // ── Suggestion items ──────────────────────────────────────────────────────

  List<Widget> _buildSuggestions(
    BuildContext context,
    SearchController controller,
  ) {
    return [
      ListenableBuilder(
        listenable: Listenable.merge([controller, _suggestionsNotifier]),
        builder: (context, _) {
          final cs = Theme.of(context).colorScheme;
          final accent = widget.primaryColor ?? cs.primary;
          final query = controller.text.trim();

          // ── Loading shimmer ────────────────────────────────────────────────────
          if (_isLoading) {
            return SizedBox(
              height: 360,
              child: ListView.builder(
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 5,
                itemBuilder: (_, __) => Skeletonizer(
                  enabled: true,
                  child: _PlaceListTile(
                    icon: Icons.location_on_outlined,
                    iconColor: accent,
                    mainText: 'Loading placeholder name',
                    secondaryText: 'City, State, Country',
                    onTap: () {},
                  ),
                ),
              ),
            );
          }

          // ── Empty query — show recent searches or empty state ──────────────────
          if (query.isEmpty) {
            if (_recentSearches.isEmpty) {
              return _buildEmptyState(context, accent);
            }
            return _buildRecentSearchesSection(context, controller, accent);
          }

          // ── No results ─────────────────────────────────────────────────────────
          if (_results.isEmpty) {
            return SizedBox(
              height: 360,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.location_off_outlined,
                        size: 56, color: cs.onSurface.withValues(alpha: 0.25)),
                    const SizedBox(height: 14),
                    Text(
                      'No results found',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: cs.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Try different keywords or check spelling',
                      style: TextStyle(
                        fontSize: 13,
                        color: cs.onSurface.withValues(alpha: 0.4),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // ── Results ────────────────────────────────────────────────────────────
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: _results.map((place) {
              return _PlaceListTile(
                icon: Icons.location_on_outlined,
                iconColor: accent,
                mainText: place['mainText'] ?? place['description'] ?? '',
                secondaryText: place['secondaryText'],
                onTap: () {
                  final label =
                      (place['mainText'] ?? place['description'] ?? '').toString();
                  _saveRecentSearch(label);
                  controller.closeView(null);
                  widget.onPlaceSelected(place);
                },
              );
            }).toList(),
          );
        },
      ),
    ];
  }

  Widget _buildEmptyState(BuildContext context, Color accent) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      height: 360,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.location_on_outlined,
                  size: 34, color: accent.withValues(alpha: 0.8)),
            ),
            const SizedBox(height: 16),
            Text(
              'Search for a location',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: cs.onSurface.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Find an address, landmark or city',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: cs.onSurface.withValues(alpha: 0.4),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSearchesSection(
    BuildContext context,
    SearchController controller,
    Color accent,
  ) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
          child: Row(
            children: [
              Text(
                'RECENT SEARCHES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                  color: cs.onSurface.withValues(alpha: 0.45),
                ),
              ),
              const Spacer(),
              TextButton(
                style: TextButton.styleFrom(
                  foregroundColor: accent,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                onPressed: _clearAllRecentSearches,
                child: const Text(
                  'Clear all',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        // Recent items
        ..._recentSearches.map(
          (query) => ListTile(
            dense: true,
            leading: Icon(Icons.history_rounded,
                size: 20, color: cs.onSurface.withValues(alpha: 0.4)),
            title: Text(
              query,
              style: TextStyle(
                fontSize: 15,
                color: cs.onSurface.withValues(alpha: 0.9),
              ),
            ),
            trailing: IconButton(
              icon: Icon(Icons.close_rounded,
                  size: 18, color: cs.onSurface.withValues(alpha: 0.35)),
              onPressed: () => _removeRecentSearch(query),
            ),
            onTap: () {
              controller.text = query;
              _onQueryChanged(query);
            },
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SearchAnchor(
      searchController: _searchController,
      viewBackgroundColor: cs.surface,
      viewHintText: widget.placeholder,
      viewLeading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () {
          _searchController.closeView(null);
          _searchController.clear();
          if (mounted) {
            setState(() {
              _results = [];
              _isLoading = false;
            });
          }
        },
      ),
      viewOnChanged: (value) {
        if (!_searchController.isOpen) _searchController.openView();
        _onQueryChanged(value);
      },
      builder: (context, controller) {
        return SearchBar(
          controller: controller,
          hintText: widget.placeholder,
          hintStyle: WidgetStateProperty.all(
            TextStyle(
              fontSize: 15,
              color: cs.onSurface.withValues(alpha: 0.45),
            ),
          ),
          textStyle: WidgetStateProperty.all(
            const TextStyle(fontSize: 15),
          ),
          leading: Icon(Icons.search_rounded,
              color: cs.onSurface.withValues(alpha: 0.5)),
          trailing: [
            if (controller.text.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.clear_rounded),
                color: cs.onSurface.withValues(alpha: 0.5),
                onPressed: () {
                  controller.clear();
                  if (mounted) setState(() => _results = []);
                },
              ),
          ],
          onTap: () => controller.openView(),
          onChanged: (value) {
            if (!_searchController.isOpen) controller.openView();
            _onQueryChanged(value);
          },
          backgroundColor: WidgetStateProperty.all(cs.surface),
          elevation: WidgetStateProperty.all(0),
          side: WidgetStateProperty.all(
            BorderSide(
              color: cs.outline.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          shadowColor: WidgetStateProperty.all(
            cs.shadow.withValues(alpha: 0.06),
          ),
          padding: WidgetStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 12),
          ),
        );
      },
      suggestionsBuilder: (context, controller) =>
          _buildSuggestions(context, controller),
    );
  }
}

// ── Private tile widget ────────────────────────────────────────────────────────

class _PlaceListTile extends StatelessWidget {
  const _PlaceListTile({
    required this.icon,
    required this.iconColor,
    required this.mainText,
    required this.onTap,
    this.secondaryText,
  });

  final IconData icon;
  final Color iconColor;
  final String mainText;
  final String? secondaryText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    mainText,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: cs.onSurface,
                    ),
                  ),
                  if (secondaryText != null && secondaryText!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      secondaryText!,
                      style: TextStyle(
                        fontSize: 13,
                        color: cs.onSurface.withValues(alpha: 0.5),
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
  }
}
