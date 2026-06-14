import 'package:flutter/material.dart';

/// A reusable empty/error state widget used across all Workern apps.
///
/// Renders an icon in a rounded container, a bold [title], an optional
/// [subtitle], and an optional [action] widget (typically a [FilledButton]).
///
/// Colors default to [ColorScheme.primaryContainer] / [ColorScheme.onPrimaryContainer].
/// Pass [iconBackground] and [iconForeground] overrides for error or warning
/// variants:
///
/// ```dart
/// // Error state
/// WorkernEmptyState(
///   icon: Icons.error_outline_rounded,
///   title: 'Could not load data',
///   subtitle: 'Check your connection and try again',
///   iconBackground: cs.errorContainer,
///   iconForeground: cs.onErrorContainer,
///   action: FilledButton.icon(
///     onPressed: onRetry,
///     icon: const Icon(Icons.refresh_rounded),
///     label: const Text('Try Again'),
///   ),
/// )
/// ```
class WorkernEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  /// Icon container background. Defaults to [ColorScheme.primaryContainer].
  final Color? iconBackground;

  /// Icon color. Defaults to [ColorScheme.onPrimaryContainer].
  final Color? iconForeground;

  /// Icon size inside the container. Defaults to 40.
  final double iconSize;

  /// Container width and height. Defaults to 80.
  final double containerSize;

  const WorkernEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
    this.iconBackground,
    this.iconForeground,
    this.iconSize = 40,
    this.containerSize = 80,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final bg = iconBackground ?? cs.primaryContainer;
    final fg = iconForeground ?? cs.onPrimaryContainer;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: containerSize,
              height: containerSize,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(containerSize * 0.3),
              ),
              child: Icon(icon, size: iconSize, color: fg),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: tt.titleMedium?.copyWith(
                color: cs.onSurface,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: tt.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
