import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:workern_models/workern_models.dart';
import 'notification_handler.dart';

/// Top-level function to handle background messages
/// Must be a top-level or static function
@pragma('vm:entry-point')
Future<void> workernFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  debugPrint('📬 Background message received: ${message.messageId}');
  debugPrint('📬 Data: ${message.data}');

  // Background messages are handled by the platform
  // Local notifications are shown automatically by Firebase on Android/iOS
}

/// Reusable service for handling push notifications across Workern apps
class WorkernNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static NotificationHandler? _handler;
  static AndroidNotificationChannel? _channel;
  static String? _userId;
  static String? _currentSpaceId;

  /// Initialize notification service with app-specific handler, userId, and spaceId
  /// This will also automatically register the FCM token for the space
  static Future<void> initialize({
    required NotificationHandler handler,
    required String userId,
    required String spaceId,
  }) async {
    _handler = handler;
    _userId = userId;
    _currentSpaceId = spaceId;
    debugPrint(
        '🔔 Initializing Workern notification service for $userId in space: $spaceId');

    // Create notification channel
    _channel = AndroidNotificationChannel(
      handler.channelId,
      handler.channelName,
      description: handler.channelDescription,
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );

    // Request permissions (iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('🔔 Permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('⚠️ User declined notification permissions');
      return;
    }

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Create notification channel (Android)
    if (_channel != null) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel!);
    }

    // Configure foreground notification presentation (iOS)
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps (app opened from terminated/background)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('📬 App opened from notification: ${initialMessage.data}');
      _handleNotificationTap(initialMessage);
    }

    // Automatically register FCM token for this space
    if (_userId != null && _currentSpaceId != null) {
      await registerFCMToken(
        userId: _userId!,
        spaceId: _currentSpaceId!,
      );
    }

    debugPrint('✅ Workern notification service initialized');
  }

  /// Initialize local notifications plugin
  static Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  /// Handle foreground messages
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📬 Foreground message received: ${message.messageId}');
    debugPrint('📬 Title: ${message.notification?.title}');
    debugPrint('📬 Body: ${message.notification?.body}');
    debugPrint('📬 Data: ${message.data}');

    // Call app-specific handler
    _handler?.onForegroundMessage(message);

    // Show local notification
    _showNotificationFromMessage(message);
  }

  /// Show notification from RemoteMessage
  static Future<void> _showNotificationFromMessage(
    RemoteMessage message,
  ) async {
    final notification = message.notification;

    if (notification == null || _channel == null) {
      debugPrint('⚠️ No notification payload or channel not initialized');
      return;
    }

    final soundFile = _handler?.notificationSound;
    final androidSound = soundFile != null && soundFile != 'default'
        ? RawResourceAndroidNotificationSound(soundFile)
        : null;

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel!.id,
          _channel!.name,
          channelDescription: _channel!.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: _handler?.notificationIcon ?? '@mipmap/ic_launcher',
          sound: androidSound,
          playSound: true,
          enableVibration: true,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
          sound: 'default',
        ),
      ),
      payload: jsonEncode(message.data),
    );

    debugPrint('✅ Local notification shown');
  }

  /// Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    debugPrint('👆 Notification tapped: ${message.data}');

    final notificationId = message.data['notificationId'] as String?;
    final spaceId = message.data['spaceId'] as String?;
    if (_userId != null && notificationId != null && spaceId != null) {
      markAsSeen(
        userId: _userId!,
        spaceId: spaceId,
        notificationId: notificationId,
      );
    }

    _handler?.onNotificationTap(message.data);
  }

  /// Handle local notification tap
  static void _onNotificationTapped(NotificationResponse response) {
    debugPrint('👆 Local notification tapped: ${response.payload}');

    if (response.payload != null && _userId != null) {
      try {
        final data = jsonDecode(response.payload!) as Map<String, dynamic>;
        final notificationId = data['notificationId'] as String?;
        final spaceId = data['spaceId'] as String?;
        if (notificationId != null && spaceId != null) {
          markAsSeen(
            userId: _userId!,
            spaceId: spaceId,
            notificationId: notificationId,
          );
        }
      } catch (e) {
        debugPrint('⚠️ Error parsing local notification payload: $e');
      }
    }

    _handler?.onLocalNotificationTap(response.payload);
  }

  /// Get the platform identifier (android, ios, web)
  static String _getPlatformIdentifier() {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'android';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'ios';
    } else {
      return 'web';
    }
  }

  /// Get FCM token and save to Firestore for a specific space and platform
  /// Stores tokens in nested array: { spaceId: { android?: [token1, token2], ios?: [token], web?: [token] } }
  static Future<String?> registerFCMToken({
    required String userId,
    required String spaceId,
  }) async {
    if (_handler == null) {
      debugPrint('⚠️ Notification handler not initialized');
      return null;
    }

    try {
      // On iOS, try to wait for APNS token but don't fail if unavailable
      // (simulator and emulator won't have APNS token)
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        debugPrint('🍎 iOS: Checking for APNS token...');

        try {
          final apnsToken = await _messaging.getAPNSToken();
          if (apnsToken != null) {
            debugPrint('✅ APNS token available');
          } else {
            debugPrint('⚠️ APNS token not available (may be simulator)');
          }
        } catch (e) {
          debugPrint('⚠️ APNS token check failed: $e');
          debugPrint('📱 Continuing anyway (normal for simulator/emulator)');
        }
      }

      final token = await _messaging.getToken();

      if (token == null) {
        debugPrint('⚠️ Failed to get FCM token');
        return null;
      }

      final platform = _getPlatformIdentifier();
      debugPrint('🔑 FCM Token [$platform]: $token for space: $spaceId');

      // Add token to array in Firestore (handles multiple devices of same platform)
      await _firestore.collection('users').doc(userId).set({
        'fcmTokens': {
          spaceId: {
            platform: FieldValue.arrayUnion([token]),
          }
        },
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      debugPrint('✅ FCM token registered [$platform] for space: $spaceId');

      // Listen for token refresh and update array
      _messaging.onTokenRefresh.listen((newToken) {
        debugPrint(
            '🔄 FCM token refreshed [$platform]: $newToken for space: $spaceId');
        _firestore.collection('users').doc(userId).set({
          'fcmTokens': {
            spaceId: {
              platform: FieldValue.arrayUnion([newToken]),
            }
          },
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      });

      return token;
    } catch (e) {
      debugPrint('❌ Error registering FCM token: $e');
      return null;
    }
  }

  /// Unregister FCM token for a specific space and platform
  static Future<void> unregisterFCMToken({
    required String userId,
    required String spaceId,
  }) async {
    if (_handler == null) {
      debugPrint('⚠️ Notification handler not initialized');
      return;
    }

    try {
      final platform = _getPlatformIdentifier();
      final token = await _messaging.getToken();

      if (token != null) {
        // Remove token from array in Firestore
        await _firestore.collection('users').doc(userId).set({
          'fcmTokens': {
            spaceId: {
              platform: FieldValue.arrayRemove([token]),
            }
          },
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }

      debugPrint('✅ FCM token unregistered [$platform] for space: $spaceId');

      // Delete FCM token from device
      await _messaging.deleteToken();
    } catch (e) {
      debugPrint('❌ Error unregistering FCM token: $e');
    }
  }

  /// Get current FCM token
  static Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      debugPrint('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// Check if notification permissions are granted
  static Future<bool> arePermissionsGranted() async {
    final settings = await _messaging.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Request notification permissions
  static Future<bool> requestPermissions() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Fetch notifications for a user in a specific space
  /// Path: users/{uid}/mySpaces/{spaceId}/notifications
  static Stream<List<WorkernNotification>> fetchNotifications({
    required String userId,
    required String spaceId,
    int limit = 50,
  }) {
    try {
      return _firestore
          .collection('users')
          .doc(userId)
          .collection('mySpaces')
          .doc(spaceId)
          .collection('notifications')
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .snapshots()
          .map((snapshot) {
        return snapshot.docs
            .map((doc) => WorkernNotification.fromFirestore(doc.data()))
            .toList();
      });
    } catch (e) {
      debugPrint('❌ Error fetching notifications: $e');
      return Stream.value([]);
    }
  }

  /// Mark notification as seen / unseen via Cloud Function
  static Future<void> markAsSeen({
    required String userId,
    required String spaceId,
    required String notificationId,
    bool seen = true,
  }) async {
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'asia-south2')
          .httpsCallable('notifications-markseen');
      await callable.call({
        'spaceId': spaceId,
        'notificationId': notificationId,
        'seen': seen,
      });

      debugPrint('✅ Notification marked as seen ($seen) via function: $notificationId');
    } catch (e) {
      debugPrint('❌ Error marking notification as seen ($seen) via function: $e');
    }
  }

  /// Delete notification via Cloud Function
  static Future<void> deleteNotification({
    required String userId,
    required String spaceId,
    required String notificationId,
  }) async {
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'asia-south2')
          .httpsCallable('notifications-remove');
      await callable.call({
        'spaceId': spaceId,
        'notificationId': notificationId,
      });

      debugPrint('✅ Notification deleted via function: $notificationId');
    } catch (e) {
      debugPrint('❌ Error deleting notification via function: $e');
    }
  }
}
