import 'package:flutter/material.dart';

/// A progress bar widget for multi-step flows (stepper, onboarding, wizards, etc.)
///
/// Shows a linear progress indicator with current step information
///
/// Example:
/// ```dart
/// StepperProgressBar(
///   currentStep: 3,
///   totalSteps: 5,
///   stepLabel: 'Profile Details',
///   primaryColor: Colors.blue,
/// )
/// ```
class StepperProgressBar extends StatelessWidget {
  /// Current step number (1-indexed)
  final int currentStep;

  /// Total number of steps
  final int totalSteps;

  /// Label for the current step (e.g., 'Profile Details', 'Address')
  final String stepLabel;

  /// Primary color for the progress bar
  final Color primaryColor;

  /// Background color for unfilled progress
  final Color? backgroundColor;

  /// Text style for step label
  final TextStyle? labelStyle;

  /// Height of the progress bar
  final double height;

  /// Border radius of the progress bar
  final double borderRadius;

  /// Padding around the widget
  final EdgeInsets padding;

  const StepperProgressBar({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.stepLabel,
    required this.primaryColor,
    this.backgroundColor,
    this.labelStyle,
    this.height = 4,
    this.borderRadius = 4,
    this.padding = const EdgeInsets.fromLTRB(24, 16, 24, 12),
  });

  @override
  Widget build(BuildContext context) {
    final progress = currentStep / totalSteps;

    return Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: height,
              backgroundColor: backgroundColor ?? Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$currentStep/$totalSteps • $stepLabel',
            style: labelStyle ?? Theme.of(context).textTheme.labelSmall,
          ),
        ],
      ),
    );
  }
}
