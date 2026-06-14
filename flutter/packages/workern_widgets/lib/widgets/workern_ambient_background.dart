import 'package:flutter/material.dart';

/// A premium ambient background for Workern apps that provides a "2026" mesh
/// gradient look without requiring external assets.
class WorkernAmbientBackground extends StatelessWidget {
  /// Custom base background color. If null, defaults to a dynamic theme-based color.
  final Color? backgroundColor;

  const WorkernAmbientBackground({
    super.key,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    // Premium modern backgrounds: deep dark base for dark mode and soft warm for light mode
    final defaultBg = isDark 
        ? const Color(0xFF09090B) // Smooth zinc-950
        : const Color(0xFFFAF9F6); // Soft warm off-white

    final bgColor = backgroundColor ?? defaultBg;

    // Ambient glows: make them slightly more visible (higher opacity) in dark mode for that premium glow look
    final blob1 = cs.primary.withValues(alpha: isDark ? 0.08 : 0.04);
    final blob2 = cs.secondary.withValues(alpha: isDark ? 0.06 : 0.03);
    final blob3 = cs.tertiary.withValues(alpha: isDark ? 0.07 : 0.03);

    return Stack(
      children: [
        // Base solid color
        Container(color: bgColor),

        // Ambient mesh gradients
        Positioned.fill(
          child: CustomPaint(
            painter: _MeshPainter(
              color1: blob1,
              color2: blob2,
              color3: blob3,
            ),
          ),
        ),
      ],
    );
  }
}

class _MeshPainter extends CustomPainter {
  _MeshPainter({
    required this.color1,
    required this.color2,
    required this.color3,
  });

  final Color color1;
  final Color color2;
  final Color color3;

  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()
      ..shader = RadialGradient(colors: [color1, color1.withValues(alpha: 0)])
          .createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.2, size.height * 0.2),
              radius: size.width * 0.8,
            ),
          );

    final paint2 = Paint()
      ..shader = RadialGradient(colors: [color2, color2.withValues(alpha: 0)])
          .createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.8, size.height * 0.5),
              radius: size.width * 0.7,
            ),
          );

    final paint3 = Paint()
      ..shader = RadialGradient(colors: [color3, color3.withValues(alpha: 0)])
          .createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.3, size.height * 0.8),
              radius: size.width * 0.6,
            ),
          );

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint1);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint2);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint3);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
