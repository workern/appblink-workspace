import 'package:flutter/material.dart';
import 'package:workern_models/communication/notification/notification.dart';
import 'package:workern_widgets/screens/notifications_screen.dart';

// Import WorkernNotificationService from workern_notifications
// We use a direct import to avoid circular dependency
import 'package:workern_notifications/src/notification_service.dart'
    as notif_service;

/// Helper class to manage notification UI operations across apps
class NotificationsHelper {
  /// Opens the notifications screen in a bottom sheet or modal dialog
  ///
  /// Parameters:
  /// - context: BuildContext for navigation
  /// - userId: User ID to fetch notifications for
  /// - spaceId: Space ID to fetch notifications for (e.g., 'nikat', shop ID, etc.)
  /// - useBottomSheet: If true, shows as bottom sheet; if false, shows as full page
  /// - onNotificationTap: Optional callback function called when a notification is tapped
  static Future<void> openNotifications({
    required BuildContext context,
    required String userId,
    required String spaceId,
    bool useBottomSheet = false,
    Function(WorkernNotification)? onNotificationTap,
  }) async {
    if (!context.mounted) return;

    if (useBottomSheet) {
      await showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (_) => _NotificationsView(
          userId: userId,
          spaceId: spaceId,
          onNotificationTap: onNotificationTap,
        ),
      );
    } else {
      if (context.mounted) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => _NotificationsView(
              userId: userId,
              spaceId: spaceId,
              onNotificationTap: onNotificationTap,
            ),
          ),
        );
      }
    }
  }
}

/// Internal widget that displays notifications list
class _NotificationsView extends StatelessWidget {
  final String userId;
  final String spaceId;
  final Function(WorkernNotification)? onNotificationTap;

  const _NotificationsView({
    required this.userId,
    required this.spaceId,
    this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context) => Scaffold(
    body: StreamBuilder<List<WorkernNotification>>(
      stream: notif_service.WorkernNotificationService.fetchNotifications(
        userId: userId,
        spaceId: spaceId,
      ),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        final notifications = snapshot.data ?? [];

        return NotificationsScreen(
          notifications: notifications,
          onNotificationTap: (notification) {
            // Call the custom callback if provided
            onNotificationTap?.call(notification);
          },
          onMarkAsRead: (notificationId) {
            notif_service.WorkernNotificationService.markAsSeen(
              userId: userId,
              spaceId: spaceId,
              notificationId: notificationId,
            );
          },
          onDelete: (notificationId) {
            notif_service.WorkernNotificationService.deleteNotification(
              userId: userId,
              spaceId: spaceId,
              notificationId: notificationId,
            );
          },
          primaryColor: Theme.of(context).primaryColor,
        );
      },
    ),
  );
}
