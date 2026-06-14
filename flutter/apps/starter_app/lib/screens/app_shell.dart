import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workern_auth/workern_auth.dart';
import 'package:workern_widgets/workern_widgets.dart';
import 'package:workern_dev_tools/workern_dev_tools.dart';
import '../config/app_colors.dart';
import '../config/app_tokens.dart';

// ── Tab definitions ──────────────────────────────────────────────────────────

const _items = [
  WorkernNavItem(icon: Icons.home_rounded, label: 'Home'),
  WorkernNavItem(
    icon: Icons.explore_rounded,
    label: 'Explore',
  ),
  // Profile uses AccountProfileScreen which has its own Scaffold/AppBar,
  // so it lives outside the ShellRoute as a top-level route.
  WorkernNavItem(
    icon: Icons.person_rounded,
    label: 'Profile',
    externalPath: '/profile',
  ),
];

String _greeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── App Shell ────────────────────────────────────────────────────────────────

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  String get _currentTitle {
    if (shell.currentIndex == 0) return 'Starter App';
    return _items[shell.currentIndex].label;
  }

  String? get _currentSubtitle {
    if (shell.currentIndex == 0) return _greeting();
    if (shell.currentIndex == 1) return 'Discover something new';
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuthenticated = ref.watch(isAuthenticatedProvider);
    final t = context.tokens;

    return WorkernAppShell(
      shell: shell,
      backgroundColor: t.surfaceBase,
      appBar: WorkernAppBar(
        title: _currentTitle,
        subtitle: _currentSubtitle,
        themeColor: AppColors.ink,
        foregroundColor: AppColors.ink,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFF8F0), AppColors.chalk],
        ),
        elevation: 0,
        showAuthAction: true,
        isUserLoggedIn: isAuthenticated,
        showNotifications: false,
        leadingWidget: WorkernThemeTrigger(
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset('assets/icons/icon_1024.png'),
            ),
          ),
        ),
      ),
      items: _items,
    );
  }
}
