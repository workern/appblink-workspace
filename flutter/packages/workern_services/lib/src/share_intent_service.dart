import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_sharing_intent/flutter_sharing_intent.dart';
import 'package:flutter_sharing_intent/model/sharing_file.dart';

export 'package:flutter_sharing_intent/model/sharing_file.dart';

/// Reusable service that wraps [FlutterSharingIntent] and emits each
/// [SharedFile] as a single broadcast stream.
///
/// Usage in an app:
/// ```dart
/// final service = WorkernShareIntentService();
/// service.initShareIntentListener().listen((file) { /* handle */ });
/// // On dispose:
/// service.dispose();
/// ```
class WorkernShareIntentService {
  StreamSubscription<List<SharedFile>>? _intentDataStreamSubscription;
  final StreamController<SharedFile> _sharedContentController =
      StreamController<SharedFile>.broadcast();
  bool _initialized = false;

  /// Sets up the share intent listeners and returns a broadcast stream of
  /// [SharedFile] for each piece of content shared into the app.
  ///
  /// Safe to call multiple times – will only initialise once.
  Stream<SharedFile> initShareIntentListener() {
    if (!_initialized) {
      _initialized = true;
      _setupListeners();
    }
    return _sharedContentController.stream;
  }

  void _setupListeners() async {
    // Handle shared content when app was closed / killed
    final initialMedia =
        await FlutterSharingIntent.instance.getInitialSharing();
    if (initialMedia.isNotEmpty) {
      for (final media in initialMedia) {
        if (media.value != null && media.value!.isNotEmpty) {
          debugPrint(
            '📥 [WorkernShare] Initial shared media: ${media.value} (${media.type})',
          );
          _sharedContentController.add(media);
        }
      }
      // Reset to prevent duplicate handling on next launch
      FlutterSharingIntent.instance.reset();
    }

    // Handle shared content while app is already running
    _intentDataStreamSubscription =
        FlutterSharingIntent.instance.getMediaStream().listen(
      (mediaList) {
        for (final media in mediaList) {
          if (media.value != null && media.value!.isNotEmpty) {
            debugPrint(
              '📥 [WorkernShare] Live shared media: ${media.value} (${media.type})',
            );
            _sharedContentController.add(media);
          }
        }
      },
      onError: (error) {
        debugPrint('❌ [WorkernShare] Share intent error: $error');
      },
    );
  }

  /// Cancel stream subscriptions and close the controller.
  void dispose() {
    _intentDataStreamSubscription?.cancel();
    _sharedContentController.close();
    FlutterSharingIntent.instance.reset();
  }
}
