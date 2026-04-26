import 'package:flutter/material.dart';

/// A compact slider with label and value display
///
/// Provides a slider with consistent styling and optional min/max labels
///
/// Example:
/// ```dart
/// CompactSlider(
///   label: 'Return period',
///   value: returnDays,
///   min: 0,
///   max: 30,
///   divisions: 30,
///   unit: 'days',
///   onChanged: (value) => setState(() => returnDays = value),
/// )
/// ```
class WorkernSlider extends StatelessWidget {
  /// Label text above the slider
  final String label;

  /// Current slider value
  final double value;

  /// Minimum slider value
  final double min;

  /// Maximum slider value
  final double max;

  /// Number of discrete divisions
  final int? divisions;

  /// Unit to display after the value (e.g., 'days', '%', 'km')
  final String? unit;

  /// Callback when slider value changes
  final ValueChanged<double> onChanged;

  /// Active color of the slider
  final Color? activeColor;

  /// Whether to show min/max labels
  final bool showMinMaxLabels;

  /// Min label text (default: min value)
  final String? minLabel;

  /// Max label text (default: max value)
  final String? maxLabel;

  const WorkernSlider({
    super.key,
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
    this.unit,
    this.activeColor,
    this.showMinMaxLabels = true,
    this.minLabel,
    this.maxLabel,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = divisions != null
        ? value.toInt().toString()
        : value.toStringAsFixed(1);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label: $displayValue${unit != null ? ' $unit' : ''}',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            if (showMinMaxLabels) ...[
              Text(
                minLabel ?? min.toInt().toString(),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Slider(
                value: value,
                min: min,
                max: max,
                divisions: divisions,
                activeColor: activeColor,
                onChanged: onChanged,
              ),
            ),
            if (showMinMaxLabels) ...[
              const SizedBox(width: 8),
              Text(
                maxLabel ?? max.toInt().toString(),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
