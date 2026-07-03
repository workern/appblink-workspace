import 'dart:ui';
import 'package:flutter/material.dart';

/// A contextual inline alert banner for app-level notifications.
///
/// Renders a tappable horizontal strip with an icon, a message, and a
/// short action label with a chevron. In 2026 mode, it uses backdrop blur
/// and glassmorphism for a layered, ambient feel.
///
/// ## Typical use-cases
/// - Low-stock warnings on a dashboard ("5 items are running low")
/// - Expiring subscription reminders ("Plan expires in 3 days")
/// - Pending action nudges ("Complete your shop profile")
/// - Balance or overdue alerts
///
/// ## Example
/// ```dart
/// WorkernAlertBanner(
///   icon: Icons.inventory_2_outlined,
///   color: Theme.of(context).colorScheme.error,
///   message: '3 items are out of stock',
///   actionLabel: 'View',
///   onTap: () => context.push('/items'),
/// )
/// ```
class WorkernAlertBanner extends StatelessWidget {
  /// Leading icon conveying the alert type (e.g. `Icons.warning_amber_rounded`).
  final IconData icon;

  /// Semantic color — used for icon, text, and (by default) the tinted background.
  final Color color;

  /// Explicit background color. In 2026 mode, this is used as a tint over the blur.
  final Color? backgroundColor;

  /// Main alert message shown in the centre of the banner.
  final String message;

  /// Short call-to-action label shown on the right (e.g. "View", "Fix", "Retry").
  final String? actionLabel;

  /// Vertical padding inside the banner. Defaults to 12.
  final double verticalPadding;

  /// Optional border radius for the banner. Defaults to 12.
  final BorderRadius? borderRadius;

  /// Whether to use the 2026 Glassmorphism style. Defaults to true.
  final bool useGlass;

  /// Called when the banner is tapped.
  final VoidCallback? onTap;

  const WorkernAlertBanner({
    super.key,
    required this.icon,
    required this.color,
    this.backgroundColor,
    required this.message,
    this.actionLabel,
    this.verticalPadding = 12,
    this.borderRadius,
    this.useGlass = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(12);
    final baseColor = backgroundColor ?? color.withValues(alpha: 0.1);

    final innerContent = Padding(
      padding:
          EdgeInsets.symmetric(horizontal: 14, vertical: verticalPadding),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          if (actionLabel != null && actionLabel!.isNotEmpty) ...[
            Text(
              actionLabel!,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.arrow_forward_ios_rounded, color: color, size: 12),
          ],
        ],
      ),
    );

    final content = onTap != null
        ? InkWell(
            onTap: onTap,
            borderRadius: radius,
            child: innerContent,
          )
        : innerContent;

    if (useGlass) {
      return ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: baseColor.withValues(alpha: 0.15),
              borderRadius: radius,
              border: Border.all(
                color: color.withValues(alpha: 0.1),
              ),
            ),
            child: Material(
              color: Colors.transparent,
              child: content,
            ),
          ),
        ),
      );
    }

    return Material(
      color: baseColor,
      borderRadius: radius,
      child: content,
    );
  }
}
