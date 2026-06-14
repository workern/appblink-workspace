import 'package:flutter/material.dart';

/// A premium verifying loader widget featuring offset counter-rotating rings
/// surrounding a central shield security icon.
class WorkernVerifyingLoader extends StatefulWidget {
  final Color? color;
  final double size;

  const WorkernVerifyingLoader({
    super.key,
    this.color,
    this.size = 90.0,
  });

  @override
  State<WorkernVerifyingLoader> createState() => _WorkernVerifyingLoaderState();
}

class _WorkernVerifyingLoaderState extends State<WorkernVerifyingLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.15).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.15, end: 1.0).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
    ]).animate(_controller);

    _rotationAnimation = Tween<double>(begin: 0.0, end: 2 * 3.141592653589793).animate(
      CurvedAnimation(parent: _controller, curve: Curves.linear),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = widget.color ?? theme.colorScheme.primary;
    final scaleFactor = widget.size / 90.0;

    return ScaleTransition(
      scale: _scaleAnimation,
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer spinning dash ring
            RotationTransition(
              turns: _rotationAnimation,
              child: SizedBox(
                width: widget.size,
                height: widget.size,
                child: CircularProgressIndicator(
                  value: 0.35,
                  strokeWidth: 2 * scaleFactor,
                  color: primaryColor.withOpacity(0.5),
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),
            // Inner spinning dash ring (opposite direction)
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Transform.rotate(
                  angle: -_rotationAnimation.value,
                  child: SizedBox(
                    width: widget.size - (14 * scaleFactor),
                    height: widget.size - (14 * scaleFactor),
                    child: CircularProgressIndicator(
                      value: 0.25,
                      strokeWidth: 3 * scaleFactor,
                      color: primaryColor,
                      backgroundColor: Colors.transparent,
                    ),
                  ),
                );
              },
            ),
            // Center shield lock icon
            Container(
              width: 54 * scaleFactor,
              height: 54 * scaleFactor,
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.security_rounded,
                color: primaryColor,
                size: 26 * scaleFactor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
