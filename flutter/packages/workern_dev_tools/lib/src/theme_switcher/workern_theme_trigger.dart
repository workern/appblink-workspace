import 'package:flutter/material.dart';
import 'workern_theme_switcher.dart';

/// Wrap any widget to make it the theme-switching trigger.
///
/// - **Double-tap** → cycle ThemeMode (System → Light → Dark)
/// - **Long-press** → cycle color palette
///
/// Requires [WorkernThemeSwitcher] to be an ancestor in the widget tree.
///
/// ```dart
/// WorkernThemeTrigger(
///   child: Image.asset('assets/icons/icon_1024.png'),
/// )
/// ```
class WorkernThemeTrigger extends StatelessWidget {
  const WorkernThemeTrigger({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTap: () => WorkernThemeSwitcher.of(context).cycleThemeMode(),
      onLongPress: () => WorkernThemeSwitcher.of(context).cyclePalette(),
      child: child,
    );
  }
}
