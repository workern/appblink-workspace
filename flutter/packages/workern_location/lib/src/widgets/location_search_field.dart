import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_google_places_sdk/flutter_google_places_sdk.dart';

/// A legacy text-field-based location search widget.
///
/// Prefer [WorkernLocationSearchBar] for new screens — it uses [SearchAnchor]
/// and recent-search history. This widget is kept for backward compatibility
/// but has been migrated to the native [FlutterGooglePlacesSdk] so iOS
/// bundle-ID-restricted API keys work correctly.
///
/// The [onPlaceSelected] callback receives a simple map with:
///   `placeId`, `description`, `mainText`, `secondaryText`, `lat`, `lng`
class LocationSearchField extends StatefulWidget {
  const LocationSearchField({
    super.key,
    required this.onPlaceSelected,
    required this.googleApiKey,
    this.latitude,
    this.longitude,
    this.hintText = 'Search for area, street name...',
    this.showAsAppBarSearch = false,
    this.primaryColor,
    this.placeType,
  });

  /// Called when the user selects a place.
  /// Map contains: `placeId`, `description`, `mainText`, `secondaryText`,
  /// and optionally `lat` / `lng` when geometry is available.
  final Function(Map<String, dynamic>) onPlaceSelected;
  final String googleApiKey;
  final double? latitude;
  final double? longitude;
  final String hintText;
  final bool showAsAppBarSearch;
  final Color? primaryColor;

  /// Optional place type filter (e.g. `'establishment'`). Ignored on this
  /// widget — provided for API compatibility with legacy callers.
  final String? placeType;

  @override
  State<LocationSearchField> createState() => _LocationSearchFieldState();
}

class _LocationSearchFieldState extends State<LocationSearchField> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  Timer? _debounceTimer;
  List<AutocompletePrediction> _predictions = [];
  bool _isLoading = false;
  OverlayEntry? _overlayEntry;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _focusNode = FocusNode();
    _controller.addListener(_onSearchChanged);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.removeListener(_onSearchChanged);
    _focusNode.removeListener(_onFocusChanged);
    _controller.dispose();
    _focusNode.dispose();
    _removeOverlay();
    super.dispose();
  }

  void _onSearchChanged() {
    _debounceTimer?.cancel();
    if (_controller.text.isEmpty) {
      _removeOverlay();
      setState(() => _predictions = []);
      return;
    }
    _debounceTimer = Timer(
      const Duration(milliseconds: 600),
      () => _fetchPredictions(_controller.text),
    );
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus) {
      Future.delayed(const Duration(milliseconds: 200), _removeOverlay);
    }
  }

  Future<void> _fetchPredictions(String input) async {
    if (input.isEmpty || !mounted) return;
    setState(() => _isLoading = true);

    try {
      final sdk = FlutterGooglePlacesSdk(widget.googleApiKey);

      LatLngBounds? bias;
      if (widget.latitude != null && widget.longitude != null) {
        const delta = 0.09; // ~10 km
        bias = LatLngBounds(
          southwest: LatLng(
            lat: widget.latitude! - delta,
            lng: widget.longitude! - delta,
          ),
          northeast: LatLng(
            lat: widget.latitude! + delta,
            lng: widget.longitude! + delta,
          ),
        );
      }

      final response = await sdk.findAutocompletePredictions(
        input,
        locationBias: bias,
      );

      if (mounted) {
        setState(() {
          _predictions = response.predictions;
          _isLoading = false;
        });
        _showOverlay();
      }
    } catch (e) {
      debugPrint('❌ Error fetching predictions (native SDK): $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _selectPrediction(AutocompletePrediction prediction) async {
    _controller.text = prediction.fullText ?? prediction.primaryText ?? '';
    _removeOverlay();
    setState(() => _predictions = []);
    _focusNode.unfocus();

    // Try to get geometry via fetchPlace
    try {
      final sdk = FlutterGooglePlacesSdk(widget.googleApiKey);
      final response = await sdk.fetchPlace(
        prediction.placeId,
        fields: [PlaceField.Id, PlaceField.Name, PlaceField.Location, PlaceField.Address],
      );
      final place = response.place;
      widget.onPlaceSelected({
        'placeId': prediction.placeId,
        'description': prediction.fullText,
        'mainText': prediction.primaryText,
        'secondaryText': prediction.secondaryText,
        if (place?.latLng != null) 'lat': place!.latLng!.lat.toString(),
        if (place?.latLng != null) 'lng': place!.latLng!.lng.toString(),
      });
    } catch (e) {
      // Fall back without coordinates
      widget.onPlaceSelected({
        'placeId': prediction.placeId,
        'description': prediction.fullText,
        'mainText': prediction.primaryText,
        'secondaryText': prediction.secondaryText,
      });
    }
  }

  void _showOverlay() {
    _removeOverlay();
    if (_predictions.isEmpty) return;

    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        left: offset.dx,
        top: offset.dy + size.height,
        width: size.width,
        child: Material(
          elevation: 4,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 300),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: ListView.separated(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              itemCount: _predictions.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final p = _predictions[index];
                return InkWell(
                  onTap: () => _selectPrediction(p),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p.primaryText ?? p.fullText ?? '',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (p.secondaryText != null &&
                                  p.secondaryText!.isNotEmpty)
                                Text(
                                  p.secondaryText!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
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
            ),
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  Widget build(BuildContext context) {
    final effectivePrimaryColor =
        widget.primaryColor ?? Theme.of(context).primaryColor;

    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      decoration: InputDecoration(
        hintText: widget.hintText,
        hintStyle: TextStyle(fontSize: 15, color: Colors.grey[400]),
        prefixIcon: Icon(
          Icons.search,
          color: effectivePrimaryColor,
          size: widget.showAsAppBarSearch ? 22 : 24,
        ),
        suffixIcon: _isLoading
            ? Padding(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(effectivePrimaryColor),
                  ),
                ),
              )
            : _controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _controller.clear();
                  _removeOverlay();
                },
              )
            : null,
        filled: true,
        fillColor: const Color(0xFFF5F5F5),
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: widget.showAsAppBarSearch ? 10 : 14,
        ),
      ),
    );
  }
}
