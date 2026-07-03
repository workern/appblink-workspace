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
class WorkernPrimaryButton extends StatefulWidget {
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

  /// Label to show during loading (optional)
  final String? loadingLabel;

  /// Whether to use gradient loading animation
  final bool useGradientLoading;

  /// Whether to display a 'Please Wait...' message with three continuously moving dots
  final bool showPleaseWaitLoading;

  /// Whether to display a loader right next to the 'Save' text
  final bool showLoaderNextToLabel;

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
    this.loadingLabel,
    this.useGradientLoading = false,
    this.showPleaseWaitLoading = true,
    this.showLoaderNextToLabel = false,
  });

  @override
  State<WorkernPrimaryButton> createState() => _WorkernPrimaryButtonState();
}

class _WorkernPrimaryButtonState extends State<WorkernPrimaryButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  late bool _displayLoading;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(vsync: this);
    _displayLoading = widget.isLoading;
    if (widget.isLoading) {
      _startLoadingAnimation();
    }
  }

  @override
  void didUpdateWidget(WorkernPrimaryButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isLoading && !oldWidget.isLoading) {
      _startLoadingAnimation();
    } else if (!widget.isLoading && oldWidget.isLoading) {
      _completeLoadingAnimation();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  void _startLoadingAnimation() {
    setState(() {
      _displayLoading = true;
    });
    if (widget.useGradientLoading && widget.loadingLabel != null) {
      _progressController.reset();
      _progressController.animateTo(
        0.9,
        duration: const Duration(seconds: 10),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _completeLoadingAnimation() {
    if (widget.useGradientLoading && widget.loadingLabel != null) {
      _progressController.animateTo(
        1.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      ).then((_) {
        if (mounted) {
          setState(() {
            _displayLoading = false;
          });
        }
      });
    } else {
      setState(() {
        _displayLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_displayLoading && widget.useGradientLoading && widget.loadingLabel != null) {
      return Padding(
        padding: widget.padding,
        child: AnimatedBuilder(
          animation: _progressController,
          builder: (context, child) {
            return _GradientLoadingWidget(
              height: widget.height,
              borderRadius: widget.borderRadius,
              primaryColor: widget.primaryColor,
              label: widget.loadingLabel!,
              fontSize: widget.fontSize,
              progress: _progressController.value,
            );
          },
        ),
      );
    }

    final isActive = widget.enabled && !_displayLoading;
    final isCustomLoading = widget.showPleaseWaitLoading || widget.showLoaderNextToLabel;

    return Padding(
      padding: widget.padding,
      child: ShadButton(
        width: double.infinity,
        height: widget.height,
        enabled: isActive,
        onPressed: isActive ? widget.onPressed : null,
        backgroundColor: _displayLoading
            ? (isCustomLoading
                ? widget.primaryColor.withValues(alpha: 0.7)
                : Colors.grey.shade400)
            : widget.primaryColor,
        foregroundColor: Colors.white,
        hoverBackgroundColor: _displayLoading
            ? (isCustomLoading
                ? widget.primaryColor.withValues(alpha: 0.7)
                : Colors.grey.shade400)
            : widget.primaryColor.withValues(alpha: 0.9),
        decoration: ShadDecoration(
          border: ShadBorder.all(radius: BorderRadius.circular(widget.borderRadius)),
        ),
        child: _displayLoading
            ? (widget.showLoaderNextToLabel
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.label,
                        style: TextStyle(
                          fontSize: widget.fontSize,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox.square(
                        dimension: 16,
                        child: widget.loadingIcon ??
                            CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                      ),
                    ],
                  )
                : widget.showPleaseWaitLoading
                    ? PleaseWaitLoadingWidget(
                        style: TextStyle(
                          fontSize: widget.fontSize,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      )
                    : SizedBox.square(
                        dimension: 18,
                        child: widget.loadingIcon ??
                            CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                      ))
            : Text(
                widget.label,
                style: TextStyle(fontSize: widget.fontSize, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }
}

class PleaseWaitLoadingWidget extends StatefulWidget {
  final TextStyle? style;
  const PleaseWaitLoadingWidget({super.key, this.style});

  @override
  State<PleaseWaitLoadingWidget> createState() => _PleaseWaitLoadingWidgetState();
}

class _PleaseWaitLoadingWidgetState extends State<PleaseWaitLoadingWidget>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (index) {
      return AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 400),
      );
    });

    _animations = _controllers.map((controller) {
      return Tween<double>(begin: 0, end: -5.0).animate(
        CurvedAnimation(
          parent: controller,
          curve: Curves.easeInOut,
        ),
      );
    }).toList();

    _startAnimations();
  }

  void _startAnimations() async {
    for (int i = 0; i < 3; i++) {
      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 120));
      if (!mounted) return;
      _controllers[i].repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textStyle = widget.style ?? const TextStyle(fontWeight: FontWeight.w600);
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'Please Wait',
          style: textStyle,
        ),
        const SizedBox(width: 4),
        SizedBox(
          height: 10,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(3, (index) {
              return AnimatedBuilder(
                animation: _animations[index],
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _animations[index].value),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: textStyle.color ?? Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  );
                },
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _GradientLoadingWidget extends StatelessWidget {
  final double height;
  final double borderRadius;
  final Color primaryColor;
  final String label;
  final double fontSize;
  final double progress;

  const _GradientLoadingWidget({
    required this.height,
    required this.borderRadius,
    required this.primaryColor,
    required this.label,
    required this.fontSize,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = this.primaryColor;
    final hsl = HSLColor.fromColor(primaryColor);
    final lighterColor = hsl.withLightness((hsl.lightness + 0.15).clamp(0.0, 1.0)).toColor();
    final darkerColor = hsl.withLightness((hsl.lightness - 0.05).clamp(0.0, 1.0)).toColor();

    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: primaryColor.withOpacity(0.25),
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius - 1),
        child: Stack(
          children: [
            // The moving gradient fill
            FractionallySizedBox(
              widthFactor: progress,
              heightFactor: 1.0,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      darkerColor,
                      primaryColor,
                      lighterColor,
                    ],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
              ),
            ),
            // The text centered on top
            Center(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  letterSpacing: 0.5,
                  shadows: [
                    Shadow(
                      color: Colors.black.withOpacity(0.3),
                      offset: const Offset(0, 1),
                      blurRadius: 2,
                    ),
                  ],
                ),
              ),
            ),
          ],
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
        child: isLoading
            ? SizedBox.square(
                dimension: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: borderColor,
                ),
              )
            : Text(
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
        child: isLoading
            ? SizedBox.square(
                dimension: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white.withOpacity(0.7),
                ),
              )
            : Text(
                label,
                style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }
}
