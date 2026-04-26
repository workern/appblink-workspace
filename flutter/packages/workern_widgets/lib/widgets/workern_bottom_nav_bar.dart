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
/// )
/// ```
class WorkernBottomNavBar extends StatelessWidget {
  const WorkernBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.items,
    required this.onTap,
  });

  /// Index of the currently active tab.
  final int currentIndex;

  /// Tab descriptors — icon + label pairs.
  final List<WorkernNavItem> items;

  /// Called when the user taps a tab with its index.
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final dividerColor = Theme.of(context).colorScheme.outlineVariant;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Divider(height: 1, thickness: 1, color: dividerColor),
        NavigationBar(
          selectedIndex: currentIndex,
          onDestinationSelected: onTap,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: items
              .map(
                (item) => NavigationDestination(
                  icon: Icon(item.icon),
                  label: item.label,
                ),
              )
              .toList(),
        ),
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
    this.externalPath,
  });

  final IconData icon;
  final String label;

  /// If non-null, tapping this tab navigates to this path via `context.go`
  /// instead of switching the shell branch.
  final String? externalPath;
}
