import 'dart:async';
import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:workern_models/workern_models.dart';
import 'package:workern_utils/workern_utils.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// Callback type for notification actions
typedef OnNotificationTap = void Function(WorkernNotification notification);
typedef OnMarkAsRead = void Function(String notificationId, bool seen);
typedef OnDelete = void Function(String notificationId);

/// Helper to get host app's card radius
BorderRadius _getCardRadius(BuildContext context) {
  final shape = Theme.of(context).cardTheme.shape;
  if (shape is RoundedRectangleBorder && shape.borderRadius is BorderRadius) {
    return shape.borderRadius as BorderRadius;
  }
  return BorderRadius.circular(14.0); // Premium fallback
}

/// Helper to get host app's menu/dialog radius
BorderRadius _getMenuRadius(BuildContext context) {
  final shape = Theme.of(context).dialogTheme.shape;
  if (shape is RoundedRectangleBorder && shape.borderRadius is BorderRadius) {
    return shape.borderRadius as BorderRadius;
  }
  return BorderRadius.circular(10.0); // Fallback
}

/// A reusable notifications screen widget for Workern apps (Premium Glassmorphic UI)
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
  bool _showOnlyUnread = true;
  bool _isSelectionMode = false;
  final Set<String> _selectedIds = {};
  final Map<String, Timer> _pendingDeletions = {};

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _deleteSelectedNotifications() {
    if (_selectedIds.isEmpty) return;
    
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ShadDialog.alert(
            title: Text('Delete ${_selectedIds.length} Notifications?'),
            description: const Text('Are you sure you want to delete the selected notifications?'),
            actions: [
              ShadButton.outline(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ShadButton.destructive(
                onPressed: () {
                  Navigator.of(context).pop();
                  _performDeleteSelected();
                },
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _performDeleteSelected() {
    final toRemove = _notifications.where((n) => _selectedIds.contains(n.id)).toList();
    if (toRemove.isEmpty) return;

    _deleteNotifications(toRemove, 'Deleted ${toRemove.length} notifications');
  }

  @override
  void initState() {
    super.initState();
    _notifications = widget.notifications
        .where((n) => !_pendingDeletions.containsKey(n.id))
        .toList();
  }

  @override
  void didUpdateWidget(NotificationsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    _notifications = widget.notifications
        .where((n) => !_pendingDeletions.containsKey(n.id))
        .toList();
  }

  @override
  void dispose() {
    for (final timer in _pendingDeletions.values.toSet()) {
      timer.cancel();
    }
    for (final id in _pendingDeletions.keys) {
      widget.onDelete(id);
    }
    _pendingDeletions.clear();
    super.dispose();
  }

  List<WorkernNotification> get _filteredNotifications {
    if (_showOnlyUnread) {
      return _notifications.where((n) => !n.seen).toList();
    }
    return _notifications;
  }

  void _handleMarkAsRead(String notificationId, bool seen) {
    widget.onMarkAsRead(notificationId, seen);
  }

  void _handleDelete(String notificationId) {
    widget.onDelete(notificationId);
  }

  void _clearAllNotifications() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ShadDialog.alert(
            title: const Text('Clear All Notifications?'),
            description: const Text('Are you sure you want to delete all notifications? This action cannot be undone.'),
            actions: [
              ShadButton.outline(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              ShadButton.destructive(
                onPressed: () {
                  Navigator.of(context).pop();
                  _performClearAll();
                },
                child: const Text('Clear All'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _performClearAll() {
    final toRemove = List<WorkernNotification>.from(_notifications);
    if (toRemove.isEmpty) return;

    _deleteNotifications(toRemove, 'All notifications cleared');
  }

  void _deleteNotifications(List<WorkernNotification> targetList, String snackBarMessage) {
    if (targetList.isEmpty) return;

    final ids = targetList.map((n) => n.id).toSet();

    setState(() {
      _notifications.removeWhere((n) => ids.contains(n.id));
      if (_isSelectionMode) {
        _selectedIds.removeAll(ids);
        if (_selectedIds.isEmpty) {
          _isSelectionMode = false;
        }
      }
    });

    final timer = Timer(const Duration(seconds: 4), () {
      _pendingDeletions.removeWhere((id, t) => ids.contains(id));
      for (final n in targetList) {
        widget.onDelete(n.id);
      }
    });

    for (final id in ids) {
      if (_pendingDeletions.containsKey(id)) {
        _pendingDeletions[id]?.cancel();
        _pendingDeletions.remove(id);
        widget.onDelete(id);
      }
      _pendingDeletions[id] = timer;
    }

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(snackBarMessage),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Undo',
          textColor: Colors.orange,
          onPressed: () {
            timer.cancel();
            for (final id in ids) {
              _pendingDeletions.remove(id);
            }

            setState(() {
              for (final n in targetList) {
                if (!_notifications.any((item) => item.id == n.id)) {
                  _notifications.add(n);
                }
              }
              _notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
            });
          },
        ),
      ),
    );
  }





  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final filteredNotifications = _filteredNotifications;

    return PopScope(
      canPop: !_isSelectionMode,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_isSelectionMode) {
          setState(() {
            _isSelectionMode = false;
            _selectedIds.clear();
          });
        }
      },
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight),
          child: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: AppBar(
                title: Text(
                  widget.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                backgroundColor: isDark
                    ? theme.colorScheme.background.withOpacity(0.65)
                    : Colors.white.withOpacity(0.7),
                elevation: 0,
                centerTitle: true,
                actions: [
                  if (_isSelectionMode) ...[
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _isSelectionMode = false;
                          _selectedIds.clear();
                        });
                      },
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface,
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 8.0, left: 8.0),
                      child: TextButton(
                        onPressed: _selectedIds.isEmpty ? null : _deleteSelectedNotifications,
                        child: Text(
                          'Delete (${_selectedIds.length})',
                          style: TextStyle(
                            color: _selectedIds.isEmpty ? theme.disabledColor : theme.colorScheme.error,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    if (_notifications.isNotEmpty) ...[
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _isSelectionMode = true;
                            _selectedIds.clear();
                          });
                        },
                        child: Text(
                          'Select',
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0, left: 8.0),
                        child: TextButton(
                          onPressed: _clearAllNotifications,
                          child: Text(
                            'Clear All',
                            style: TextStyle(
                              color: theme.colorScheme.error,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ),
        body: Stack(
          children: [
            // ── Ambient Background Gradient & Glow Blobs ──
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isDark
                        ? [
                            theme.colorScheme.background,
                            theme.colorScheme.primaryContainer.withOpacity(0.04),
                            theme.colorScheme.background,
                          ]
                        : [
                            theme.colorScheme.background,
                            theme.colorScheme.primaryContainer.withOpacity(0.15),
                            theme.colorScheme.background,
                          ],
                  ),
                ),
              ),
            ),
            // Glow Blob 1 (Top Right)
            Positioned(
              top: -100,
              right: -100,
              width: 280,
              height: 280,
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      theme.colorScheme.primary.withOpacity(isDark ? 0.08 : 0.18),
                      theme.colorScheme.primary.withOpacity(0),
                    ],
                  ),
                ),
              ),
            ),
            // Glow Blob 2 (Bottom Left)
            Positioned(
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      theme.colorScheme.secondary.withOpacity(isDark ? 0.06 : 0.12),
                      theme.colorScheme.secondary.withOpacity(0),
                    ],
                  ),
                ),
              ),
            ),
  
            // ── Scrollable Body Content ──
            SafeArea(
              bottom: false,
              child: Column(
                children: [
                  const SizedBox(height: 8.0),
                  _buildSegmentedFilter(),
                  const SizedBox(height: 8.0),
                  Expanded(
                    child: filteredNotifications.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.only(
                              top: 8.0,
                              bottom: 64.0,
                            ),
                            itemCount: filteredNotifications.length,
                            itemBuilder: (context, index) {
                              final notification = filteredNotifications[index];
                              return _buildDismissibleTile(notification);
                            },
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Modern horizontal segmented filter tabs
  Widget _buildSegmentedFilter() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.all(4.0),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04),
          borderRadius: BorderRadius.circular(9999.0),
          border: Border.all(
            color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: _buildFilterTab(
                label: 'Unread',
                isActive: _showOnlyUnread,
                count: _notifications.where((n) => !n.seen).length,
                onTap: () => setState(() => _showOnlyUnread = true),
              ),
            ),
            Expanded(
              child: _buildFilterTab(
                label: 'All',
                isActive: !_showOnlyUnread,
                count: _notifications.length,
                onTap: () => setState(() => _showOnlyUnread = false),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTab({
    required String label,
    required bool isActive,
    required int count,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        decoration: BoxDecoration(
          color: isActive
              ? (isDark ? Colors.white.withOpacity(0.1) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(9999.0),
          boxShadow: isActive && !isDark
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6.0),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 6.0,
                  vertical: 1,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? theme.colorScheme.primary
                      : (isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08)),
                  borderRadius: BorderRadius.circular(4.0),
                ),
                child: Text(
                  count.toString(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isActive
                        ? theme.colorScheme.onPrimary
                        : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final cardRadius = _getCardRadius(context);

    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            padding: const EdgeInsets.all(24.0),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.4),
              borderRadius: cardRadius,
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Glowing bell icon
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withOpacity(isDark ? 0.1 : 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.notifications_none_rounded,
                    size: 48,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 16.0),
                Text(
                  _showOnlyUnread ? 'All Caught Up!' : widget.emptyMessage,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8.0),
                Text(
                  _showOnlyUnread
                      ? 'No unread notifications at the moment.'
                      : 'We\'ll notify you when something important arrives.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Wraps card with swipe interactions
  Widget _buildDismissibleTile(WorkernNotification notification) {
    final theme = Theme.of(context);
    final cardRadius = _getCardRadius(context);

    return Dismissible(
      key: Key(notification.id),
      direction: _isSelectionMode ? DismissDirection.none : DismissDirection.horizontal,
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.endToStart) {
          return true; // Allows delete dismiss
        } else {
          // Toggle seen status
          final newSeenStatus = !notification.seen;
          _handleMarkAsRead(notification.id, newSeenStatus);
          
          setState(() {
            final idx = _notifications.indexWhere((n) => n.id == notification.id);
            if (idx != -1) {
              _notifications[idx] = notification.copyWith(seen: newSeenStatus);
            }
            if (_showOnlyUnread && newSeenStatus) {
              _notifications.removeWhere((n) => n.id == notification.id);
            }
          });
          return false; // Bounce back
        }
      },
      onDismissed: (direction) {
        if (direction == DismissDirection.endToStart) {
          _deleteNotifications([notification], 'Notification deleted');
        }
      },
      background: _buildSwipeBackground(
        alignment: Alignment.centerLeft,
        color: notification.seen ? theme.colorScheme.primary : Colors.grey[600]!,
        icon: notification.seen ? Icons.mark_email_unread_outlined : Icons.done_all_rounded,
        label: notification.seen ? 'Mark Unread' : 'Mark Read',
        borderRadius: cardRadius,
      ),
      secondaryBackground: _buildSwipeBackground(
        alignment: Alignment.centerRight,
        color: theme.colorScheme.error,
        icon: Icons.delete_outline_rounded,
        label: 'Delete',
        borderRadius: cardRadius,
      ),
      child: _buildNotificationTile(notification),
    );
  }

  Widget _buildSwipeBackground({
    required Alignment alignment,
    required Color color,
    required IconData icon,
    required String label,
    required BorderRadius borderRadius,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: 16.0,
        vertical: 6.0,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      decoration: BoxDecoration(
        color: color.withOpacity(0.85),
        borderRadius: borderRadius,
      ),
      alignment: alignment,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: alignment == Alignment.centerLeft
            ? [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 8.0),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ]
            : [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 8.0),
                Icon(icon, color: Colors.white, size: 20),
              ],
      ),
    );
  }

  Widget _buildNotificationTile(WorkernNotification notification) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final cardRadius = _getCardRadius(context);

    // Determine specific styling based on read state
    final cardBg = notification.seen
        ? (isDark ? Colors.white.withOpacity(0.03) : Colors.white.withOpacity(0.65))
        : theme.colorScheme.primaryContainer.withOpacity(isDark ? 0.08 : 0.35);

    final outlineColor = notification.seen
        ? (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.05))
        : theme.colorScheme.primary.withOpacity(isDark ? 0.25 : 0.15);

    final data = notification.data;
    var shopName = data?['shopName'] as String?;
    final shopLogo = data?['shopLogo'] as String?;

    // Fallback parsing of shopName from title (for backward compatibility)
    if (shopName == null || shopName.isEmpty) {
      if (notification.title.contains(': ')) {
        final parts = notification.title.split(': ');
        shopName = parts[0];
      }
    }

    // Strip redundant shop name from display title
    var displayTitle = notification.title;
    if (shopName != null && shopName.isNotEmpty && displayTitle.startsWith('$shopName: ')) {
      displayTitle = displayTitle.substring(shopName.length + 2);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 16.0,
        vertical: 6.0,
      ),
      child: ClipRRect(
        borderRadius: cardRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: cardRadius,
              border: Border.all(color: outlineColor, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.04 : 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: InkWell(
              borderRadius: cardRadius,
              onTap: () {
                if (_isSelectionMode) {
                  _toggleSelection(notification.id);
                } else {
                  if (!notification.seen) {
                    _handleMarkAsRead(notification.id, true);
                  }
                  widget.onNotificationTap(notification);
                }
              },
              onLongPress: _isSelectionMode
                  ? null
                  : () {
                      setState(() {
                        _isSelectionMode = true;
                        _selectedIds.clear();
                        _selectedIds.add(notification.id);
                      });
                    },
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_isSelectionMode)
                      Padding(
                        padding: const EdgeInsets.only(right: 12.0, top: 8.0),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: Checkbox(
                            value: _selectedIds.contains(notification.id),
                            activeColor: theme.colorScheme.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4.0),
                            ),
                            onChanged: (bool? value) {
                              _toggleSelection(notification.id);
                            },
                          ),
                        ),
                      )
                    else
                      // Status vertical strip or dot
                      Container(
                        width: 6,
                        height: 6,
                        margin: const EdgeInsets.only(top: 18, right: 12.0),
                        decoration: BoxDecoration(
                          color: notification.seen ? Colors.transparent : theme.colorScheme.primary,
                          shape: BoxShape.circle,
                        ),
                      ),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Header row with Shop details (if available) or generic notification title
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              if (shopName != null && shopName.isNotEmpty) ...[
                                Expanded(
                                  child: Row(
                                    children: [
                                      _buildShopAvatar(shopLogo, shopName, theme),
                                      const SizedBox(width: 8.0),
                                      Expanded(
                                        child: Text(
                                          shopName,
                                          style: theme.textTheme.titleSmall?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14.0,
                                            color: theme.colorScheme.onSurface,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ] else ...[
                                Expanded(
                                  child: Text(
                                    displayTitle,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      fontWeight: notification.seen ? FontWeight.w500 : FontWeight.w700,
                                      fontSize: 14.5,
                                      color: theme.colorScheme.onSurface,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                              const SizedBox(width: 8.0),
                              Text(
                                formatDate(notification.createdAt),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
                                ),
                              ),
                              _buildTileMenu(notification),
                            ],
                          ),
                          const SizedBox(height: 8.0),

                          // 2. Broadcast Title (if shop details were shown in header)
                          if (shopName != null && shopName.isNotEmpty && displayTitle.isNotEmpty) ...[
                            Text(
                              displayTitle,
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: notification.seen ? FontWeight.w600 : FontWeight.w700,
                                fontSize: 13.5,
                                color: theme.colorScheme.onSurface,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4.0),
                          ],

                          // 3. Message Body
                          Text(
                            notification.description,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.85),
                              height: 1.35,
                              fontSize: 13.5,
                            ),
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (notification.imageUrl != null &&
                              notification.imageUrl!.isNotEmpty &&
                              notification.imageUrl != shopLogo) ...[
                            const SizedBox(height: 12.0),
                            _buildTileImage(notification.imageUrl!),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTileImage(String url) {
    final cardRadius = _getCardRadius(context);

    return Container(
      decoration: BoxDecoration(
        borderRadius: cardRadius,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: cardRadius,
        child: Image.network(
          url,
          height: 140,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              height: 140,
              color: Theme.of(context).colorScheme.surfaceVariant,
              child: const Center(
                child: Icon(Icons.image_not_supported_outlined, size: 28),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTileMenu(WorkernNotification notification) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final menuRadius = _getMenuRadius(context);

    return Material(
      color: Colors.transparent,
      child: PopupMenuButton<String>(
        icon: Icon(
          Icons.more_horiz_rounded,
          color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
          size: 20,
        ),
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(minWidth: 150),
        shape: RoundedRectangleBorder(
          borderRadius: menuRadius,
          side: BorderSide(
            color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
          ),
        ),
        color: isDark ? const Color(0xFF1E1E24) : Colors.white,
        elevation: 6,
        onSelected: (action) {
          if (action == 'read') {
            final newSeenStatus = !notification.seen;
            _handleMarkAsRead(notification.id, newSeenStatus);
            setState(() {
              final idx = _notifications.indexWhere((n) => n.id == notification.id);
              if (idx != -1) {
                _notifications[idx] = notification.copyWith(seen: newSeenStatus);
              }
              if (_showOnlyUnread && newSeenStatus) {
                _notifications.removeWhere((n) => n.id == notification.id);
              }
            });
          } else if (action == 'delete') {
            _deleteNotifications([notification], 'Notification deleted');
          }
        },
        itemBuilder: (context) => [
          PopupMenuItem(
            value: 'read',
            child: Row(
              children: [
                Icon(
                  notification.seen ? Icons.mark_email_unread_outlined : Icons.done_all_rounded,
                  size: 16,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8.0),
                Text(
                  notification.seen ? 'Mark unread' : 'Mark read',
                  style: theme.textTheme.bodyMedium?.copyWith(fontSize: 13),
                ),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(
                  Icons.delete_outline_rounded,
                  size: 16,
                  color: theme.colorScheme.error,
                ),
                const SizedBox(width: 8.0),
                Text(
                  'Delete',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 13,
                    color: theme.colorScheme.error,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShopAvatar(String? logoUrl, String shopName, ThemeData theme) {
    final isDark = theme.brightness == Brightness.dark;
    final fallbackColor = theme.colorScheme.primary.withOpacity(isDark ? 0.2 : 0.1);
    final textStyle = TextStyle(
      color: theme.colorScheme.primary,
      fontWeight: FontWeight.bold,
      fontSize: 14,
    );

    Widget avatarContent;
    if (logoUrl != null && logoUrl.isNotEmpty) {
      avatarContent = CachedNetworkImage(
        imageUrl: logoUrl,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(
          color: fallbackColor,
          child: const Center(
            child: SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                color: Colors.blue,
              ),
            ),
          ),
        ),
        errorWidget: (context, url, error) => Container(
          color: fallbackColor,
          child: Center(
            child: Text(
              shopName.isNotEmpty ? shopName[0].toUpperCase() : 'N',
              style: textStyle,
            ),
          ),
        ),
      );
    } else {
      avatarContent = Container(
        color: fallbackColor,
        child: Center(
          child: Text(
            shopName.isNotEmpty ? shopName[0].toUpperCase() : 'N',
            style: textStyle,
          ),
        ),
      );
    }

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withOpacity(0.5),
          width: 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: avatarContent,
    );
  }
}
