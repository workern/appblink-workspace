import 'dart:ui';
import 'package:flutter/material.dart';

/// A bottom navigation bar for Workern apps backed by the Material 3
/// [NavigationBar] widget.
///
/// Colors are derived from the app's [ThemeData] so no color params are needed.
/// Configure appearance via [NavigationBarThemeData] in [MaterialApp.theme].
///
/// Usage with GoRouter StatefulShellRoute:
/// ```dart
/// WorkernBottomNavBar(
///   currentIndex: shell.currentIndex,
///   items: [
///     WorkernNavItem(icon: Icons.home_rounded, label: 'Home'),
///     WorkernNavItem(icon: Icons.explore_rounded, label: 'Explore'),
///   ],
///   onTap: (i) => shell.goBranch(i),
///   useGlass: true,
/// )
/// ```
class WorkernBottomNavBar extends StatelessWidget {
  const WorkernBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.items,
    required this.onTap,
    this.useGlass = false,
  });

  /// Index of the currently active tab.
  final int currentIndex;

  /// Tab descriptors — icon + label pairs.
  final List<WorkernNavItem> items;

  /// Called when the user taps a tab with its index.
  final ValueChanged<int> onTap;

  /// If true, applies a glassmorphic effect.
  final bool useGlass;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dividerColor = cs.outlineVariant;

    final Widget bar = NavigationBar(
      backgroundColor: useGlass ? cs.surface.withValues(alpha: 0.7) : null,
      elevation: useGlass ? 0 : null,
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      destinations: items
          .map(
            (item) => NavigationDestination(
              icon: Icon(item.icon),
              selectedIcon: item.selectedIcon != null
                  ? Icon(item.selectedIcon)
                  : null,
              label: item.label,
            ),
          )
          .toList(),
    );

    if (useGlass) {
      return ClipRRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Divider(
                height: 1,
                thickness: 1,
                color: dividerColor.withValues(alpha: 0.4),
              ),
              bar,
            ],
          ),
        ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Divider(height: 1, thickness: 1, color: dividerColor),
        bar,
      ],
    );
  }
}

/// Descriptor for a single tab in [WorkernBottomNavBar] / [WorkernAppShell].
///
/// Set [externalPath] for tabs whose screen lives outside the
/// [StatefulShellRoute] (e.g. a profile screen with its own `Scaffold`).
/// [WorkernAppShell] will call `context.go(externalPath)` instead of
/// `shell.goBranch(index)` for those tabs.
class WorkernNavItem {
  const WorkernNavItem({
    required this.icon,
    required this.label,
    this.selectedIcon,
    this.externalPath,
  });

  final IconData icon;
  final String label;

  /// Optional icon to show when the tab is selected.
  final IconData? selectedIcon;

  /// If non-null, tapping this tab navigates to this path via `context.go`
  /// instead of switching the shell branch.
  final String? externalPath;
}
