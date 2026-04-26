import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workern_auth/workern_auth.dart';
import 'notification_service.dart';
import 'notification_handler.dart';

/// Parameter class for notification service initialization
class NotificationServiceParams {
  final NotificationHandler handler;
  final String spaceId;

  const NotificationServiceParams({
    required this.handler,
    required this.spaceId,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationServiceParams &&
          runtimeType == other.runtimeType &&
          spaceId == other.spaceId;

  @override
  int get hashCode => spaceId.hashCode;
}

/// Provider to automatically initialize and manage the notification service
/// Takes spaceId as a parameter since it's app-specific
/// Watches firebaseUserProvider to auto-initialize on sign-in/out/switch
final notificationServiceProvider =
    FutureProvider.family<void, NotificationServiceParams>((ref, params) async {
  final firebaseUser = ref.watch(firebaseUserProvider);

  // Initialize when user signs in, cleanup when signs out
  if (firebaseUser != null) {
    await WorkernNotificationService.initialize(
      handler: params.handler,
      userId: firebaseUser.uid,
      spaceId: params.spaceId,
    );
  } else {
    // User signed out - optionally cleanup here if needed
    // For now, the service will just be waiting for next sign-in
  }
});

/// Alternative: A simpler version that just provides access to the service
/// Use this if you want more manual control over initialization
final notificationServiceAccessProvider = Provider((ref) {
  return WorkernNotificationService;
});
