import 'package:flutter/material.dart';
import 'action_buttons.dart';

/// A set of action buttons for multi-step flows
///
/// Provides Continue, Skip, and Previous buttons with consistent styling
///
/// Example:
/// ```dart
/// StepperButtons(
///   onContinue: () => context.go('/next-step'),
///   onSkip: () => context.go('/home'),
///   onPrevious: () => context.go('/previous-step'),
///   showSkip: true,
///   showPrevious: true,
///   primaryColor: Colors.blue,
/// )
/// ```
class StepperButtons extends StatefulWidget {
  /// Callback when Continue button is pressed
  final VoidCallback onContinue;

  /// Callback when Skip button is pressed (optional)
  final VoidCallback? onSkip;

  /// Callback when Previous button is pressed (optional)
  final VoidCallback? onPrevious;

  /// Whether to show the Skip button
  final bool showSkip;

  /// Whether to show the Previous button
  final bool showPrevious;

  /// Primary color for Continue and Skip buttons
  final Color primaryColor;

  /// Label for Continue button
  final String continueLabel;

  /// Label for Skip button
  final String skipLabel;

  /// Label for Previous button
  final String previousLabel;

  /// Icon for Continue button
  final IconData? continueIcon;

  /// Icon for Skip button
  final IconData? skipIcon;

  /// Icon for Previous button
  final IconData? previousIcon;

  /// Whether Continue button is enabled
  final bool continueEnabled;

  /// Whether buttons are in loading state
  final bool isLoading;

  /// Height of all buttons
  final double buttonHeight;

  /// Padding around the widget
  final EdgeInsets padding;

  /// Border radius for buttons
  final double borderRadius;

  /// Whether to use compact icon-only buttons
  final bool useIconButtons;

  const StepperButtons({
    super.key,
    required this.onContinue,
    this.onSkip,
    this.onPrevious,
    this.showSkip = true,
    this.showPrevious = true,
    required this.primaryColor,
    this.continueLabel = 'Continue',
    this.skipLabel = 'Skip',
    this.previousLabel = 'Previous',
    this.continueIcon,
    this.skipIcon,
    this.previousIcon,
    this.continueEnabled = true,
    this.isLoading = false,
    this.buttonHeight = 48,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 6,
    this.useIconButtons = false,
  });

  @override
  State<StepperButtons> createState() => _StepperButtonsState();
}

enum _LoadingButtonType { none, continue_, skip, previous }

class _StepperButtonsState extends State<StepperButtons> {
  _LoadingButtonType _loadingButtonType = _LoadingButtonType.none;

  @override
  void didUpdateWidget(StepperButtons oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reset loading state when isLoading becomes false
    if (oldWidget.isLoading && !widget.isLoading) {
      _loadingButtonType = _LoadingButtonType.none;
    }
  }

  void _onContinuePressed() {
    setState(() => _loadingButtonType = _LoadingButtonType.continue_);
    widget.onContinue();
  }

  void _onSkipPressed() {
    setState(() => _loadingButtonType = _LoadingButtonType.skip);
    widget.onSkip?.call();
  }

  void _onPreviousPressed() {
    setState(() => _loadingButtonType = _LoadingButtonType.previous);
    widget.onPrevious?.call();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.useIconButtons) {
      return Padding(
        padding: widget.padding,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Previous Button
            if (widget.showPrevious && widget.onPrevious != null)
              IconButton(
                icon: Icon(widget.previousIcon ?? Icons.arrow_back),
                onPressed: widget.isLoading ? null : _onPreviousPressed,
                tooltip: widget.previousLabel,
              ),

            // Skip Button
            if (widget.showSkip && widget.onSkip != null)
              IconButton(
                icon: Icon(widget.skipIcon ?? Icons.close),
                onPressed: widget.isLoading ? null : _onSkipPressed,
                tooltip: widget.skipLabel,
              ),

            // Continue Button
            IconButton(
              icon: Icon(widget.continueIcon ?? Icons.arrow_forward),
              onPressed: widget.continueEnabled && !widget.isLoading
                  ? _onContinuePressed
                  : null,
              tooltip: widget.continueLabel,
              color: widget.primaryColor,
            ),
          ],
        ),
      );
    }

    // Horizontal row layout for non-icon buttons
    return Padding(
      padding: widget.padding,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Previous Button
          if (widget.showPrevious && widget.onPrevious != null) ...[
            Expanded(
              child: WorkernSecondaryButton(
                label: widget.previousLabel,
                onPressed: widget.isLoading ? null : _onPreviousPressed,
                borderColor: Colors.grey.shade400,
                textColor: Colors.black87,
                height: widget.buttonHeight,
                borderRadius: widget.borderRadius,
                isLoading:
                    widget.isLoading &&
                    _loadingButtonType == _LoadingButtonType.previous,
              ),
            ),
            const SizedBox(width: 12),
          ],

          // Skip Button
          if (widget.showSkip && widget.onSkip != null) ...[
            Expanded(
              child: WorkernSecondaryButton(
                label: widget.skipLabel,
                onPressed: widget.isLoading ? null : _onSkipPressed,
                borderColor: widget.primaryColor,
                textColor: widget.primaryColor,
                height: widget.buttonHeight,
                borderRadius: widget.borderRadius,
                isLoading:
                    widget.isLoading &&
                    _loadingButtonType == _LoadingButtonType.skip,
              ),
            ),
            const SizedBox(width: 12),
          ],

          // Continue Button
          Expanded(
            child: WorkernSecondaryButton(
              label: widget.continueLabel,
              onPressed: widget.continueEnabled && !widget.isLoading
                  ? _onContinuePressed
                  : null,
              borderColor: widget.primaryColor,
              textColor: widget.primaryColor,
              height: widget.buttonHeight,
              borderRadius: widget.borderRadius,
              isLoading:
                  widget.isLoading &&
                  _loadingButtonType == _LoadingButtonType.continue_,
            ),
          ),
        ],
      ),
    );
  }
}
