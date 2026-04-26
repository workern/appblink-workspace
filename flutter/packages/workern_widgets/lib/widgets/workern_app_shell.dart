import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'workern_bottom_nav_bar.dart';

/// A [StatefulShellRoute]-aware scaffold shell for Workern apps.
///
/// Composes a [PreferredSizeWidget] app bar, a tab body (from the shell),
/// and a [WorkernBottomNavBar] into a single [Scaffold].
///
/// App-specific concerns (app bar title/colours, tab definitions) stay in
/// the calling app. This widget only owns the structural glue.
///
/// Tabs whose [WorkernNavItem.externalPath] is set navigate via
/// `context.go(externalPath)` instead of switching the shell branch.
/// This is useful for screens (e.g. a profile screen) that have their own
/// `Scaffold` / `AppBar` and must live outside the [StatefulShellRoute].
///
/// Usage:
/// ```dart
/// StatefulShellRoute.indexedStack(
///   builder: (context, state, shell) => WorkernAppShell(
///     shell: shell,
///     appBar: WorkernAppBar(title: 'My App', ...),
///     items: const [
///       WorkernNavItem(icon: Icons.home_rounded, label: 'Home'),
///       WorkernNavItem(icon: Icons.person_rounded, label: 'Profile',
///                      externalPath: '/profile'),
///     ],
///   ),
///   branches: [...],
/// )
/// ```
class WorkernAppShell extends StatelessWidget {
  const WorkernAppShell({
    super.key,
    required this.shell,
    required this.appBar,
    required this.items,
    this.backgroundColor,
  });

  /// The navigation shell provided by [StatefulShellRoute.indexedStack].
  final StatefulNavigationShell shell;

  /// App bar rendered at the top of the scaffold.
  /// Typically a [WorkernAppBar] configured by the calling app.
  final PreferredSizeWidget appBar;

  /// Tab descriptors shown in the bottom nav bar.
  final List<WorkernNavItem> items;

  /// Scaffold background colour. Defaults to [ColorScheme.surface].
  final Color? backgroundColor;

  void _onTap(BuildContext context, int index) {
    final item = items[index];
    if (item.externalPath != null) {
      context.go(item.externalPath!);
    } else {
      shell.goBranch(index, initialLocation: index == shell.currentIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? Theme.of(context).colorScheme.surface,
      appBar: appBar,
      body: shell,
      bottomNavigationBar: WorkernBottomNavBar(
        currentIndex: shell.currentIndex,
        items: items,
        onTap: (i) => _onTap(context, i),
      ),
    );
  }
}
