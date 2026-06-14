import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A widget that applies a smooth scale-down animation and optional haptic
/// feedback when pressed. Perfect for custom buttons, cards, and interactive chips.
class ScalePress extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;
  final bool enableHaptics;
  final bool active;

  const ScalePress({
    super.key,
    required this.child,
    this.onTap,
    this.scaleFactor = 0.96,
    this.enableHaptics = true,
    this.active = true,
  });

  @override
  State<ScalePress> createState() => _ScalePressState();
}

class _ScalePressState extends State<ScalePress> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleFactor,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.active) {
      return widget.child;
    }

    return Listener(
      onPointerDown: (_) {
        _controller.forward();
        if (widget.enableHaptics) {
          HapticFeedback.lightImpact();
        }
      },
      onPointerUp: (_) {
        _controller.reverse();
      },
      onPointerCancel: (_) {
        _controller.reverse();
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: widget.child,
        ),
      ),
    );
  }
}
