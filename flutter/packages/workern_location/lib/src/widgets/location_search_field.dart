import 'package:flutter/material.dart';
import 'package:google_places_flutter/model/prediction.dart';
import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

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

  final Function(Prediction) onPlaceSelected;
  final String googleApiKey;
  final double? latitude;
  final double? longitude;
  final String hintText;
  final bool showAsAppBarSearch;
  final Color? primaryColor;
  final String? placeType;

  @override
  State<LocationSearchField> createState() => _LocationSearchFieldState();
}

class _LocationSearchFieldState extends State<LocationSearchField> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  Timer? _debounceTimer;
  List<Prediction> _predictions = [];
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
      setState(() {
        _predictions = [];
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 600), () {
      _fetchPredictions(_controller.text);
    });
  }

  void _onFocusChanged() {
    if (!_focusNode.hasFocus) {
      Future.delayed(const Duration(milliseconds: 200), () {
        _removeOverlay();
      });
    }
  }

  Future<void> _fetchPredictions(String input) async {
    if (input.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final requestBody = {
        'input': input,
        'languageCode': 'en',
        'regionCode': 'IN',
        'includedPrimaryTypes': widget.placeType != null
            ? [widget.placeType]
            : null,
        'includedRegionCodes': ['in'],
      };

      // Add location bias if coordinates are available
      if (widget.latitude != null && widget.longitude != null) {
        requestBody['locationBias'] = {
          'circle': {
            'center': {
              'latitude': widget.latitude,
              'longitude': widget.longitude,
            },
            'radius': 10000.0, // 10km radius for nearby results
          },
        };
      }

      final response = await http.post(
        Uri.parse('https://places.googleapis.com/v1/places:autocomplete'),
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': widget.googleApiKey,
        },
        body: json.encode(requestBody),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final suggestions = data['suggestions'] as List<dynamic>? ?? [];

        final predictions = suggestions
            .where((s) => s['placePrediction'] != null)
            .map((suggestion) {
              final placePrediction = suggestion['placePrediction'];
              final text = placePrediction['text'];

              return Prediction(
                description: text['text'] as String?,
                placeId: placePrediction['placeId'] as String?,
                reference: placePrediction['placeId'] as String?,
                structuredFormatting: null,
                terms: null,
                types: (placePrediction['types'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .toList(),
              );
            })
            .toList();

        setState(() {
          _predictions = predictions;
          _isLoading = false;
        });

        _showOverlay();
      } else {
        debugPrint('❌ Autocomplete API error: ${response.statusCode}');
        debugPrint('Response: ${response.body}');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('❌ Error fetching predictions: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchPlaceDetails(String placeId) async {
    try {
      final response = await http.get(
        Uri.parse(
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&key=${widget.googleApiKey}',
        ),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          final result = data['result'];
          final geometry = result['geometry'];
          final location = geometry['location'];

          final prediction = Prediction(
            description: result['formatted_address'] as String?,
            placeId: placeId,
            lat: location['lat'].toString(),
            lng: location['lng'].toString(),
            reference: placeId,
            structuredFormatting: null,
            terms: null,
            types: (result['types'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList(),
          );

          widget.onPlaceSelected(prediction);
        }
      }
    } catch (e) {
      debugPrint('❌ Error fetching place details: $e');
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
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final prediction = _predictions[index];
                return InkWell(
                  onTap: () {
                    _controller.text = prediction.description ?? '';
                    _removeOverlay();
                    setState(() {
                      _predictions = [];
                    });
                    _focusNode.unfocus();
                    if (prediction.placeId != null) {
                      _fetchPlaceDetails(prediction.placeId!);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            prediction.description ?? '',
                            style: const TextStyle(fontSize: 14),
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
