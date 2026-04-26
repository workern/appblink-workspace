import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Callback type for handling notification taps
typedef NotificationTapCallback = void Function(Map<String, dynamic> data);

/// Abstract class for handling app-specific notification logic
abstract class NotificationHandler {
  /// Handle notification received in foreground
  void onForegroundMessage(RemoteMessage message) {
    debugPrint('📬 Foreground message: ${message.data}');
  }

  /// Handle notification tap (app opened from notification)
  void onNotificationTap(Map<String, dynamic> data) {
    debugPrint('👆 Notification tapped: $data');
  }

  /// Handle local notification tap
  void onLocalNotificationTap(String? payload) {
    debugPrint('👆 Local notification tapped: $payload');
  }

  /// Get the Firestore collection path for storing FCM tokens
  /// e.g., 'users', 'deliveryPartners', 'shops'
  String get tokenCollectionPath;

  /// Get the notification channel ID for this app
  /// e.g., 'orders', 'delivery_offers', 'messages'
  String get channelId;

  /// Get the notification channel name for this app
  /// e.g., 'Order Notifications', 'Delivery Offers', 'Messages'
  String get channelName;

  /// Get the notification channel description
  String get channelDescription;

  /// Get the notification icon (Android)
  /// Default: '@mipmap/ic_launcher'
  String get notificationIcon => '@mipmap/ic_launcher';

  /// Get the notification sound (Android)
  /// Default: 'default'
  String? get notificationSound => 'default';
}
