import 'package:workern_notifications/workern_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class StarterAppNotificationHandler extends NotificationHandler {
  @override
  String get tokenCollectionPath => 'users';

  @override
  String get channelId => 'starter_app_channel';

  @override
  String get channelName => 'Starter App Notifications';

  @override
  String get channelDescription => 'Notifications for Starter App';
}
