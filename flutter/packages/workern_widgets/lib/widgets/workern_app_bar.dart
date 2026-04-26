import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workern_auth/workern_auth.dart';
import 'adaptive_dialog.dart';

/// A customizable app bar widget that shows app name, auth actions, and notifications
///
/// The auth state and actions are controlled by the parent widget,
/// making this widget flexible and independent of Firebase.
///
/// Example:
/// ```dart
/// WorkernAppBar(
///   title: 'Sangrah',
///   themeColor: Colors.purple,
///   showAuthAction: true,
///   isUserLoggedIn: user != null,
///   onLogout: () async {
///     await FirebaseAuth.instance.signOut();
///     if (context.mounted) Navigator.pushNamed(context, '/login');
///   },
///   showNotifications: true,
///   onNotificationTap: () => Navigator.pushNamed(context, '/notifications'),
///   customActions: [
///     IconButton(
///       icon: Icon(Icons.filter_list, color: Colors.white),
///       onPressed: () => showFilterDialog(context),
///     ),
///   ],
/// )
/// ```
class WorkernAppBar extends ConsumerWidget implements PreferredSizeWidget {
  /// The title/app name to display
  final String title;

  /// The primary theme color of the app (used for app bar background)
  final Color themeColor;

  /// Whether to show sign in/out action
  final bool showAuthAction;

  /// Whether the user is currently logged in (if showAuthAction is true)
  final bool isUserLoggedIn;

  /// Callback when logout is confirmed
  final VoidCallback? onLogout;

  /// Whether to show notifications bell icon
  final bool showNotifications;

  /// Callback when notification bell is tapped
  final VoidCallback? onNotificationTap;

  /// Number of unseen notifications to display as a badge
  final int unseenNotificationCount;

  /// Text color of the app bar (defaults to white)
  final Color foregroundColor;

  /// Elevation of the app bar
  final double elevation;

  /// Whether to show drawer toggle button (hamburger menu)
  final bool showDrawer;

  /// Whether to show back button (for popping screens)
  final bool showBackButton;

  /// Callback when back button is pressed
  final VoidCallback? onBackPressed;

  /// Custom action buttons to display in the app bar (before standard actions)
  final List<Widget>? customActions;

  /// Optional gradient background. When set the flat [themeColor] background is
  /// replaced by this gradient. Use with [foregroundColor] set to a dark color
  /// for the ambient / Design-V2 header style.
  final Gradient? gradient;

  /// Optional subtitle shown below [title] in a smaller muted style.
  /// When provided the app bar height expands to accommodate both lines.
  final String? subtitle;

  /// Whether to show a profile icon button when the user is logged in.
  /// Defaults to true. Pass [onProfileTapped] to handle the navigation.
  final bool showProfileAction;

  /// Callback when the profile icon is tapped. Only relevant when
  /// [showProfileAction] is true and [isUserLoggedIn] is true.
  final VoidCallback? onProfileTapped;

  /// Optional custom leading widget displayed on the left side of the app bar.
  /// When provided, overrides the back button and drawer toggle.
  final Widget? leadingWidget;

  const WorkernAppBar({
    super.key,
    required this.title,
    required this.themeColor,
    this.showAuthAction = false,
    this.isUserLoggedIn = false,
    this.onLogout,
    this.showNotifications = true,
    this.onNotificationTap,
    this.unseenNotificationCount = 0,
    this.foregroundColor = Colors.white,
    this.elevation = 2,
    this.showDrawer = false,
    this.showBackButton = false,
    this.onBackPressed,
    this.customActions,
    this.gradient,
    this.subtitle,
    this.showProfileAction = true,
    this.onProfileTapped,
    this.leadingWidget,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasSubtitle = subtitle != null && subtitle!.isNotEmpty;
    return AppBar(
      title: hasSubtitle
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  subtitle!,
                  style: TextStyle(
                    color: foregroundColor.withOpacity(0.6),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
                Text(
                  title,
                  style: TextStyle(
                    color: foregroundColor,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                    height: 1.2,
                  ),
                ),
              ],
            )
          : Text(
              title,
              style: TextStyle(
                color: foregroundColor,
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
      backgroundColor: gradient != null ? Colors.transparent : themeColor,
      flexibleSpace: gradient != null
          ? DecoratedBox(
              decoration: BoxDecoration(gradient: gradient),
              child: const SizedBox.expand(),
            )
          : null,
      elevation: elevation,
      automaticallyImplyLeading: showDrawer || showBackButton,
      leadingWidth: leadingWidget != null ? 64 : null,
      leading:
          leadingWidget ??
          (showBackButton
              ? IconButton(
                  icon: Icon(Icons.arrow_back, color: foregroundColor),
                  onPressed: onBackPressed ?? () => Navigator.pop(context),
                  tooltip: 'Back',
                )
              : null),
      actions: [
        if (customActions != null) ...customActions!,
        if (showProfileAction && isUserLoggedIn)
          IconButton(
            icon: Icon(Icons.account_circle_outlined, color: foregroundColor),
            tooltip: 'Account',
            onPressed: onProfileTapped ?? () {},
          ),
        if (showNotifications) ...[
          Stack(
            children: [
              IconButton(
                icon: Icon(Icons.notifications, color: foregroundColor),
                onPressed: onNotificationTap ?? () {},
                tooltip: 'Notifications',
              ),
              if (unseenNotificationCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      unseenNotificationCount > 99
                          ? '99+'
                          : '$unseenNotificationCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
        if (showAuthAction) ...[
          if (isUserLoggedIn)
            IconButton(
              icon: Icon(Icons.logout, color: foregroundColor),
              onPressed: () => _showLogoutConfirmation(context, ref),
              tooltip: 'Logout',
            )
          else
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/login'),
              child: Text('Sign In', style: TextStyle(color: foregroundColor)),
            ),
        ],
        const SizedBox(width: 8),
      ],
    );
  }

  void _showLogoutConfirmation(BuildContext context, WidgetRef ref) async {
    final confirmed = await showAdaptiveConfirmationDialog(
      context: context,
      title: 'Sign Out',
      message: 'Are you sure you want to logout?',
      confirmLabel: 'Logout',
      isDestructive: true,
    );
    if (confirmed) {
      if (onLogout != null) {
        onLogout!.call();
      } else {
        // Use workern_auth's authServiceProvider when onLogout is null
        final authService = ref.read(authServiceProvider);
        await authService.signOut();
      }
    }
  }

  @override
  Size get preferredSize => Size.fromHeight(
    subtitle != null && subtitle!.isNotEmpty
        ? kToolbarHeight + 18
        : kToolbarHeight,
  );
}
