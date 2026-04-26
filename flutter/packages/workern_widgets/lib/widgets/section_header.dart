import 'package:flutter/material.dart';

/// A section header with title and optional subtitle
///
/// Provides consistent typography and spacing for section headers
///
/// Example:
/// ```dart
/// SectionHeader(
///   title: 'Personal Information',
///   subtitle: 'Enter your basic details',
/// )
/// ```
class SectionHeader extends StatelessWidget {
  /// Title text (main heading)
  final String title;

  /// Optional subtitle text (description)
  final String? subtitle;

  /// Title text style
  final TextStyle? titleStyle;

  /// Subtitle text style
  final TextStyle? subtitleStyle;

  /// Spacing between title and subtitle
  final double spacing;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.titleStyle,
    this.subtitleStyle,
    this.spacing = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style:
              titleStyle ??
              Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
        ),
        if (subtitle != null) ...[
          SizedBox(height: spacing),
          Text(
            subtitle!,
            style:
                subtitleStyle ??
                Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: Colors.grey.shade600),
          ),
        ],
      ],
    );
  }
}
