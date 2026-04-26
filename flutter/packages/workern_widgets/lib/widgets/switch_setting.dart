import 'package:flutter/material.dart';

/// A row with title, subtitle, and a switch control
///
/// Commonly used for enable/disable settings in forms
///
/// Example:
/// ```dart
/// SwitchSetting(
///   title: 'Enable Notifications',
///   subtitle: 'Receive updates about your orders',
///   value: notificationsEnabled,
///   activeColor: Colors.blue,
///   onChanged: (value) => setState(() => notificationsEnabled = value),
/// )
/// ```
class SwitchSetting extends StatelessWidget {
  /// Title text (main label)
  final String title;

  /// Subtitle text (description)
  final String subtitle;

  /// Current value of the switch
  final bool value;

  /// Callback when switch value changes
  final ValueChanged<bool> onChanged;

  /// Active color of the switch
  final Color? activeColor;

  /// Title text style
  final TextStyle? titleStyle;

  /// Subtitle text style
  final TextStyle? subtitleStyle;

  const SwitchSetting({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.activeColor,
    this.titleStyle,
    this.subtitleStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style:
                    titleStyle ??
                    Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style:
                    subtitleStyle ??
                    Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          activeThumbColor: activeColor,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
