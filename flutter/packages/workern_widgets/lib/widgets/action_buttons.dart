import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// A primary action button with consistent styling across all Workern apps
///
/// Features:
/// - Loading state support
/// - Customizable colors and labels
/// - Full width by default
/// - Accessible disabled state
///
/// Example:
/// ```dart
/// WorkernPrimaryButton(
///   label: 'Continue',
///   onPressed: () => context.go('/next'),
///   isLoading: false,
///   primaryColor: Colors.blue,
/// )
/// ```
class WorkernPrimaryButton extends StatelessWidget {
  /// Button label text
  final String label;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Primary color for the button
  final Color primaryColor;

  /// Whether button is in loading state
  final bool isLoading;

  /// Whether button is enabled
  final bool enabled;

  /// Height of the button
  final double height;

  /// Border radius of the button
  final double borderRadius;

  /// Padding around the button
  final EdgeInsets padding;

  /// Font size for the label
  final double fontSize;

  /// Custom icon to show during loading
  final Widget? loadingIcon;

  const WorkernPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    required this.primaryColor,
    this.isLoading = false,
    this.enabled = true,
    this.height = 48,
    this.borderRadius = 6,
    this.padding = EdgeInsets.zero,
    this.fontSize = 14,
    this.loadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = enabled && !isLoading;
    return Padding(
      padding: padding,
      child: ShadButton(
        width: double.infinity,
        height: height,
        enabled: isActive,
        onPressed: isActive ? onPressed : null,
        backgroundColor: isLoading ? Colors.grey.shade400 : primaryColor,
        foregroundColor: Colors.white,
        hoverBackgroundColor: isLoading
            ? Colors.grey.shade400
            : primaryColor.withOpacity(0.9),
        decoration: ShadDecoration(
          border: ShadBorder.all(radius: BorderRadius.circular(borderRadius)),
        ),
        leading: isLoading
            ? SizedBox.square(
                dimension: 16,
                child:
                    loadingIcon ??
                    CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white.withOpacity(0.7),
                    ),
              )
            : null,
        child: Text(
          label,
          style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

/// A secondary action button with consistent styling across all Workern apps
///
/// Features:
/// - Outlined button style
/// - Loading state support
/// - Customizable border color
/// - Consistent sizing with primary button
/// - Full width by default
///
/// Example:
/// ```dart
/// WorkernSecondaryButton(
///   label: 'Skip',
///   onPressed: () => context.go('/home'),
///   borderColor: Colors.blue,
/// )
/// ```
class WorkernSecondaryButton extends StatelessWidget {
  /// Button label text
  final String label;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Border color for the button
  final Color borderColor;

  /// Text color for the label
  final Color textColor;

  /// Whether button is in loading state
  final bool isLoading;

  /// Whether button is enabled
  final bool enabled;

  /// Height of the button
  final double height;

  /// Border radius of the button
  final double borderRadius;

  /// Padding around the button
  final EdgeInsets padding;

  /// Font size for the label
  final double fontSize;

  /// Border width
  final double borderWidth;

  const WorkernSecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    required this.borderColor,
    this.textColor = Colors.black87,
    this.isLoading = false,
    this.enabled = true,
    this.height = 48,
    this.borderRadius = 6,
    this.padding = EdgeInsets.zero,
    this.fontSize = 14,
    this.borderWidth = 1,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = enabled && !isLoading;
    final effectiveBorderColor = isActive ? borderColor : Colors.grey.shade300;
    final effectiveTextColor = isActive ? textColor : Colors.grey.shade600;
    return Padding(
      padding: padding,
      child: ShadButton.outline(
        width: double.infinity,
        height: height,
        enabled: isActive,
        onPressed: isActive ? onPressed : null,
        foregroundColor: effectiveTextColor,
        hoverForegroundColor: effectiveTextColor,
        decoration: ShadDecoration(
          border: ShadBorder.all(
            color: effectiveBorderColor,
            width: borderWidth,
            radius: BorderRadius.circular(borderRadius),
          ),
        ),
        leading: isLoading
            ? SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: borderColor,
                ),
              )
            : null,
        child: Text(
          label,
          style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

/// A danger/destructive action button for operations that should be done with caution
///
/// Features:
/// - Red color by default to indicate danger
/// - Same styling as primary button
/// - Clear visual distinction from normal actions
///
/// Example:
/// ```dart
/// WorkernDangerButton(
///   label: 'Delete',
///   onPressed: () => deleteItem(),
/// )
/// ```
class WorkernDangerButton extends StatelessWidget {
  /// Button label text
  final String label;

  /// Callback when button is pressed
  final VoidCallback? onPressed;

  /// Whether button is in loading state
  final bool isLoading;

  /// Whether button is enabled
  final bool enabled;

  /// Height of the button
  final double height;

  /// Border radius of the button
  final double borderRadius;

  /// Padding around the button
  final EdgeInsets padding;

  /// Font size for the label
  final double fontSize;

  const WorkernDangerButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.enabled = true,
    this.height = 48,
    this.borderRadius = 6,
    this.padding = EdgeInsets.zero,
    this.fontSize = 14,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = enabled && !isLoading;
    return Padding(
      padding: padding,
      child: ShadButton.destructive(
        width: double.infinity,
        height: height,
        enabled: isActive,
        onPressed: isActive ? onPressed : null,
        decoration: ShadDecoration(
          border: ShadBorder.all(radius: BorderRadius.circular(borderRadius)),
        ),
        leading: isLoading
            ? SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white.withOpacity(0.7),
                ),
              )
            : null,
        child: Text(
          label,
          style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
