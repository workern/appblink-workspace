import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_sharing_intent/model/sharing_file.dart';
import 'share_intent_service.dart';

/// Provides a single [WorkernShareIntentService] instance that is
/// automatically disposed when the provider scope is destroyed.
final workernShareIntentServiceProvider =
    Provider<WorkernShareIntentService>((ref) {
  final service = WorkernShareIntentService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Stream provider that emits every [SharedFile] received from other apps.
///
/// Listen to this provider in your widget tree to react to incoming shares.
/// ```dart
/// ref.listen(workernSharedMediaStreamProvider, (_, next) {
///   next.whenData((file) => /* handle */);
/// });
/// ```
final workernSharedMediaStreamProvider = StreamProvider<SharedFile>((ref) {
  final service = ref.watch(workernShareIntentServiceProvider);
  return service.initShareIntentListener();
});

/// Notifier that holds the current pending shared content.
///
/// Set to non-null when a share arrives; clear it once the user has handled
/// it (e.g. after saving, navigating, etc.).
///
/// ```dart
/// // Set
/// ref.read(workernPendingSharedMediaProvider.notifier).set(file);
/// // Clear
/// ref.read(workernPendingSharedMediaProvider.notifier).clear();
/// ```
class WorkernPendingSharedMediaNotifier extends Notifier<SharedFile?> {
  @override
  SharedFile? build() => null;

  void set(SharedFile? media) => state = media;
  void clear() => state = null;
}

final workernPendingSharedMediaProvider =
    NotifierProvider<WorkernPendingSharedMediaNotifier, SharedFile?>(
  WorkernPendingSharedMediaNotifier.new,
);
