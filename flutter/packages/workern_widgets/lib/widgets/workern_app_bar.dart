import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workern_auth/workern_auth.dart';
import 'adaptive_dialog.dart';

/// A customizable app bar widget that shows app name, auth actions, and notifications
///
/// In 2026 mode, it supports backdrop blur, glassmorphism, and ambient layering.
class WorkernAppBar extends ConsumerWidget implements PreferredSizeWidget {
  /// The title/app name to display
  final String title;

  /// The primary theme color of the app. In non-glass mode, this is the background.
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

  /// Text color of the app bar (defaults to white, or onSurface in glass mode)
  final Color? foregroundColor;

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
  /// replaced by this gradient.
  final Gradient? gradient;

  /// Optional subtitle shown below [title] in a smaller muted style.
  final String? subtitle;

  /// Whether to show a profile icon button when the user is logged in.
  final bool showProfileAction;

  /// Callback when the profile icon is tapped.
  final VoidCallback? onProfileTapped;

  /// Optional custom leading widget displayed on the left side of the app bar.
  final Widget? leadingWidget;

  /// Optional custom width for the leading widget.
  final double? leadingWidth;

  /// Optional custom title widget. If provided, [title] is ignored.
  final Widget? titleWidget;

  /// Optional custom height for the app bar. Defaults to [kToolbarHeight] (56).
  final double? height;

  /// Whether to use the 2026 Glassmorphism style with backdrop blur.
  final bool useGlass;

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
    this.foregroundColor,
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
    this.leadingWidth,
    this.titleWidget,
    this.height,
    this.useGlass = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasSubtitle = subtitle != null && subtitle!.isNotEmpty;
    final cs = Theme.of(context).colorScheme;
    final effectiveForegroundColor =
        foregroundColor ?? (useGlass ? cs.onSurface : Colors.white);

    final appBar = AppBar(
      title:
          titleWidget ??
          (hasSubtitle
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      subtitle!,
                      style: TextStyle(
                        color: effectiveForegroundColor.withOpacity(0.6),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.2,
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        title,
                        style: TextStyle(
                          color: effectiveForegroundColor,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                          height: 1.2,
                        ),
                      ),
                    ),
                  ],
                )
              : FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    title,
                    style: TextStyle(
                      color: effectiveForegroundColor,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )),
      backgroundColor: useGlass
          ? Colors.transparent
          : (gradient != null ? Colors.transparent : themeColor),
      flexibleSpace: gradient != null
          ? DecoratedBox(
              decoration: BoxDecoration(gradient: gradient),
              child: const SizedBox.expand(),
            )
          : null,
      toolbarHeight: height,
      elevation: useGlass ? 0 : elevation,
      automaticallyImplyLeading: showDrawer || showBackButton,
      leadingWidth: leadingWidth ?? (leadingWidget != null ? 64 : null),
      leading:
          leadingWidget ??
          (showBackButton
              ? IconButton(
                  icon: Icon(Icons.arrow_back, color: effectiveForegroundColor),
                  onPressed: onBackPressed ??
                      () {
                        try {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        } catch (_) {
                          Navigator.maybePop(context);
                        }
                      },
                  tooltip: 'Back',
                )
              : null),
      systemOverlayStyle: useGlass ? SystemUiOverlayStyle.dark : null,
      actions: [
        if (customActions != null) ...customActions!,
        if (showNotifications) ...[
          Stack(
            children: [
              IconButton(
                icon: Icon(
                  Icons.notifications,
                  color: effectiveForegroundColor,
                ),
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
        if (showProfileAction)
          IconButton(
            icon: Icon(
              Icons.account_circle_outlined,
              color: effectiveForegroundColor,
            ),
            tooltip: 'Account',
            onPressed: onProfileTapped ?? () {},
          ),
        if (showAuthAction) ...[
          if (isUserLoggedIn)
            IconButton(
              icon: Icon(Icons.logout, color: effectiveForegroundColor),
              onPressed: () => _showLogoutConfirmation(context, ref),
              tooltip: 'Logout',
            )
          else
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/login'),
              child: Text(
                'Sign In',
                style: TextStyle(color: effectiveForegroundColor),
              ),
            ),
        ],
        const SizedBox(width: 8),
      ],
    );

    if (useGlass) {
      return ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            color: themeColor.withValues(alpha: 0.1),
            child: appBar,
          ),
        ),
      );
    }

    return appBar;
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
    height ??
        (subtitle != null && subtitle!.isNotEmpty
            ? kToolbarHeight + 18
            : kToolbarHeight),
  );
}
