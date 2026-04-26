import 'package:flutter/material.dart';

/// A compact checkbox list tile with consistent styling
///
/// Provides a checkbox with a title and optional subtitle in a consistent format
///
/// Example:
/// ```dart
/// CompactCheckbox(
///   title: 'Accept Terms',
///   value: acceptedTerms,
///   onChanged: (value) => setState(() => acceptedTerms = value),
/// )
/// ```
class WorkernCheckbox extends StatelessWidget {
  /// Title text (main label)
  final String title;

  /// Subtitle text (optional description)
  final String? subtitle;

  /// Current value of the checkbox
  final bool value;

  /// Callback when checkbox value changes
  final ValueChanged<bool> onChanged;

  /// Active color of the checkbox
  final Color? activeColor;

  /// Control position (leading or trailing)
  final ListTileControlAffinity controlAffinity;

  /// Content padding
  final EdgeInsetsGeometry? contentPadding;

  /// Title text style
  final TextStyle? titleStyle;

  /// Subtitle text style
  final TextStyle? subtitleStyle;

  const WorkernCheckbox({
    super.key,
    required this.title,
    this.subtitle,
    required this.value,
    required this.onChanged,
    this.activeColor,
    this.controlAffinity = ListTileControlAffinity.leading,
    this.contentPadding,
    this.titleStyle,
    this.subtitleStyle,
  });

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      contentPadding: contentPadding ?? EdgeInsets.zero,
      controlAffinity: controlAffinity,
      title: Text(title, style: titleStyle ?? const TextStyle(fontSize: 14)),
      subtitle: subtitle != null
          ? Text(
              subtitle!,
              style:
                  subtitleStyle ??
                  TextStyle(fontSize: 11, color: Colors.grey.shade600),
            )
          : null,
      value: value,
      activeColor: activeColor,
      onChanged: (newValue) => onChanged(newValue ?? false),
    );
  }
}
