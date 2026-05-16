import 'package:workern_notifications/workern_notifications.dart';

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
