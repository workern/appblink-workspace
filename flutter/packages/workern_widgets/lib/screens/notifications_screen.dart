import 'package:flutter/material.dart';
import 'package:workern_models/workern_models.dart';
import 'package:workern_utils/workern_utils.dart';

/// Callback type for notification actions
typedef OnNotificationTap = void Function(WorkernNotification notification);
typedef OnMarkAsRead = void Function(String notificationId);
typedef OnDelete = void Function(String notificationId);

/// A reusable notifications screen widget for Workern apps
class NotificationsScreen extends StatefulWidget {
  /// List of notifications to display
  final List<WorkernNotification> notifications;

  /// Callback when a notification is tapped
  final OnNotificationTap onNotificationTap;

  /// Callback when mark as read action is triggered
  final OnMarkAsRead onMarkAsRead;

  /// Callback when delete action is triggered
  final OnDelete onDelete;

  /// Primary color for the app (for styling)
  final Color primaryColor;

  /// Title for the screen
  final String title;

  /// Empty state message
  final String emptyMessage;

  const NotificationsScreen({
    super.key,
    required this.notifications,
    required this.onNotificationTap,
    required this.onMarkAsRead,
    required this.onDelete,
    this.primaryColor = Colors.blue,
    this.title = 'Notifications',
    this.emptyMessage = 'No notifications yet',
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late List<WorkernNotification> _notifications;
  bool _showOnlyUnread = false;

  @override
  void initState() {
    super.initState();
    _notifications = List.from(widget.notifications);
  }

  @override
  void didUpdateWidget(NotificationsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    _notifications = List.from(widget.notifications);
  }

  List<WorkernNotification> get _filteredNotifications {
    if (_showOnlyUnread) {
      return _notifications.where((n) => !n.seen).toList();
    }
    return _notifications;
  }

  void _handleMarkAsRead(String notificationId) {
    widget.onMarkAsRead(notificationId);
  }

  void _handleDelete(String notificationId) {
    widget.onDelete(notificationId);
  }

  @override
  Widget build(BuildContext context) {
    final filteredNotifications = _filteredNotifications;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        elevation: 0,
        centerTitle: true,
        actions: [
          if (filteredNotifications.isNotEmpty)
            PopupMenuButton(
              itemBuilder: (context) => [
                PopupMenuItem(
                  child: Row(
                    children: [
                      Icon(
                        _showOnlyUnread ? Icons.done_all : Icons.filter_list,
                        color: widget.primaryColor,
                      ),
                      const SizedBox(width: 8),
                      Text(_showOnlyUnread ? 'Show All' : 'Unread Only'),
                    ],
                  ),
                  onTap: () {
                    setState(() => _showOnlyUnread = !_showOnlyUnread);
                  },
                ),
              ],
            ),
        ],
      ),
      body: filteredNotifications.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              itemCount: filteredNotifications.length,
              itemBuilder: (context, index) {
                return _buildNotificationTile(filteredNotifications[index]);
              },
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_off_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            widget.emptyMessage,
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationTile(WorkernNotification notification) {
    return GestureDetector(
      onTap: () {
        // Mark as seen when notification is tapped
        if (!notification.seen) {
          _handleMarkAsRead(notification.id);
        }
        // Then handle the notification tap
        widget.onNotificationTap(notification);
      },
      child: Container(
        color: notification.seen ? Colors.white : Colors.blue.withOpacity(0.05),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with title, timestamp, and actions
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Notification indicator
                  if (!notification.seen)
                    Container(
                      width: 12,
                      height: 12,
                      margin: const EdgeInsets.only(top: 4, right: 12),
                      decoration: BoxDecoration(
                        color: widget.primaryColor,
                        shape: BoxShape.circle,
                      ),
                    )
                  else
                    const SizedBox(width: 24),

                  // Title and timestamp
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          notification.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formatDate(notification.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Actions menu
                  PopupMenuButton(
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        child: Row(
                          children: [
                            Icon(
                              notification.seen
                                  ? Icons.mark_email_unread
                                  : Icons.done_all,
                              color: widget.primaryColor,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              notification.seen
                                  ? 'Mark as unread'
                                  : 'Mark as read',
                            ),
                          ],
                        ),
                        onTap: () => _handleMarkAsRead(notification.id),
                      ),
                      PopupMenuItem(
                        child: const Row(
                          children: [
                            Icon(
                              Icons.delete_outline,
                              color: Colors.red,
                              size: 18,
                            ),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                        onTap: () => _handleDelete(notification.id),
                      ),
                    ],
                  ),
                ],
              ),

              // Description
              Padding(
                padding: const EdgeInsets.only(left: 24, top: 8),
                child: Text(
                  notification.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.black87,
                    height: 1.4,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              // Image if available
              if (notification.imageUrl != null &&
                  notification.imageUrl!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 24, top: 12),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      notification.imageUrl!,
                      height: 150,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          height: 150,
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Center(
                            child: Icon(Icons.image_not_supported),
                          ),
                        );
                      },
                    ),
                  ),
                ),

              const SizedBox(height: 12),
              Divider(height: 1, color: Colors.grey[300]),
            ],
          ),
        ),
      ),
    );
  }
}
