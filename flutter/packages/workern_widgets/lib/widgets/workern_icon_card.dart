import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// Layout variants for [WorkernIconCard].
///
/// - [grid]: Vertical — icon on top, title + description below.
///   Best for feature grids, action pads, category tiles (2–3 cols).
/// - [list]: Horizontal — icon on left, text in centre, optional trailing on right.
///   Best for settings rows, nav menus, profile sections.
enum WorkernCardLayout { grid, list }

/// A Design-V2 compliant, tappable icon + text card built on [ShadCard].
///
/// Used across all Workern apps for feature grids, settings rows, and
/// navigation tiles. Follows the tonal-icon-container pattern popularised
/// by Linear, Notion, and Apple Settings.
///
/// ### Grid layout (default)
/// ```dart
/// WorkernIconCard(
///   icon: Icons.bolt_rounded,
///   title: 'Quick Publish',
///   description: 'One tap to push your latest build',
///   accentColor: Colors.orange,
///   onTap: () => _publish(),
/// )
/// ```
///
/// ### List layout
/// ```dart
/// WorkernIconCard(
///   layout: WorkernCardLayout.list,
///   icon: Icons.notifications_rounded,
///   title: 'Notifications',
///   description: 'Push alerts for build status',
///   trailing: const Icon(Icons.chevron_right_rounded),
///   onTap: () => context.push('/settings/notifications'),
/// )
/// ```
class WorkernIconCard extends StatelessWidget {
  const WorkernIconCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.accentColor,
    this.onTap,
    this.trailing,
    this.layout = WorkernCardLayout.grid,
    this.semanticLabel,
    this.backgroundColor,
  });

  /// The icon displayed inside the tonal container.
  final IconData icon;

  /// Short card heading — keep to ≤3 words.
  final String title;

  /// Supporting text — appears muted below the title.
  final String description;

  /// Accent used for icon container tint. Defaults to [ColorScheme.primary].
  final Color? accentColor;

  /// Called when the card is tapped. If null, the card is non-interactive.
  final VoidCallback? onTap;

  /// Optional trailing widget — only visible in [WorkernCardLayout.list].
  /// Useful for chevrons, switches, or badge counts.
  final Widget? trailing;

  /// Controls the visual layout of the card. Defaults to [WorkernCardLayout.grid].
  final WorkernCardLayout layout;

  /// Accessibility label. Defaults to "$title — $description".
  final String? semanticLabel;

  /// Explicit card background. Defaults to [ColorScheme.surfaceContainerLow].
  ///
  /// Override in app-specific wrappers when you want a custom surface
  /// (e.g., brand-token `surfaceRaised`) while keeping the shared widget.
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final accent = accentColor ?? colorScheme.primary;
    final bool interactive = onTap != null;
    final bg = backgroundColor ?? colorScheme.surfaceContainerLow;

    return Semantics(
      label: semanticLabel ?? '$title — $description',
      button: interactive,
      child: ShadCard(
        padding: EdgeInsets.zero,
        backgroundColor: bg,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: accent.withValues(alpha: 0.07),
          highlightColor: accent.withValues(alpha: 0.04),
          child: layout == WorkernCardLayout.grid
              ? _GridContent(
                  icon: icon,
                  title: title,
                  description: description,
                  accent: accent,
                )
              : _ListContent(
                  icon: icon,
                  title: title,
                  description: description,
                  accent: accent,
                  trailing: trailing,
                ),
        ),
      ),
    );
  }
}

// ─── Grid content (vertical) ────────────────────────────────────────────────

class _GridContent extends StatelessWidget {
  const _GridContent({
    required this.icon,
    required this.title,
    required this.description,
    required this.accent,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _IconContainer(icon: icon, accent: accent, size: 36, iconSize: 18),
          const SizedBox(height: 10),
          Text(
            title,
            style: textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface.withValues(alpha: 0.90),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 3),
          Text(
            description,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.45),
              height: 1.4,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ─── List content (horizontal) ───────────────────────────────────────────────

class _ListContent extends StatelessWidget {
  const _ListContent({
    required this.icon,
    required this.title,
    required this.description,
    required this.accent,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color accent;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _IconContainer(icon: icon, accent: accent, size: 42, iconSize: 20),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface.withValues(alpha: 0.92),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withValues(alpha: 0.50),
                    height: 1.35,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (trailing != null) ...[const SizedBox(width: 12), trailing!],
        ],
      ),
    );
  }
}

// ─── Shared tonal icon container ─────────────────────────────────────────────

class _IconContainer extends StatelessWidget {
  const _IconContainer({
    required this.icon,
    required this.accent,
    required this.size,
    required this.iconSize,
  });

  final IconData icon;
  final Color accent;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Icon(icon, size: iconSize, color: accent),
    );
  }
}
