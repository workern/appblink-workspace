import 'dart:math' as math;
import 'package:flutter/material.dart';

/// A clock-style loading indicator made of 12 egg shapes arranged in a circle.
/// One egg lights up per frame, leaving a fading trail on the previous egg —
/// mimicking the animation from the egg_clock_lighting_sequence design.
///
/// Usage:
/// ```dart
/// EggClockLoader()                          // default size, theme primary color
/// EggClockLoader(size: 120, color: Colors.red)
/// EggClockLoader(frameDuration: Duration(milliseconds: 400))
/// ```
class EggClockLoader extends StatefulWidget {
  const EggClockLoader({
    super.key,
    this.size = 80,
    this.color,
    this.frameDuration = const Duration(milliseconds: 600),
  });

  /// Overall widget size (width = height).
  final double size;

  /// Color of the lit egg and glow. Defaults to [ColorScheme.primary].
  final Color? color;

  /// Duration each egg stays lit before moving to the next.
  final Duration frameDuration;

  @override
  State<EggClockLoader> createState() => _EggClockLoaderState();
}

class _EggClockLoaderState extends State<EggClockLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      // Full cycle = frameDuration × 12 eggs
      duration: widget.frameDuration * 12,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Theme.of(context).colorScheme.primary;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, __) => CustomPaint(
          painter: _EggClockPainter(
            progress: _controller.value,
            color: color,
            isDark: isDark,
          ),
        ),
      ),
    );
  }
}

class _EggClockPainter extends CustomPainter {
  const _EggClockPainter({
    required this.progress,
    required this.color,
    required this.isDark,
  });

  final double progress;
  final Color color;
  final bool isDark;

  static const int _n = 12;

  double _getGlow(int eggIndex, int frame) {
    if (eggIndex == frame) return 1.0;
    if (eggIndex == (frame - 1 + _n) % _n) return 0.4;
    return 0.0;
  }

  /// Egg bezier path centered at origin, matching the HTML canvas shape.
  Path _eggPath(double ew, double eh) {
    return Path()
      ..moveTo(0, -eh)
      ..cubicTo(0.6 * ew, -eh, ew, -0.3 * eh, ew, 0.35 * eh)
      ..cubicTo(ew, 0.85 * eh, 0.6 * ew, 1.2 * eh, 0, 1.2 * eh)
      ..cubicTo(-0.6 * ew, 1.2 * eh, -ew, 0.85 * eh, -ew, 0.35 * eh)
      ..cubicTo(-ew, -0.3 * eh, -0.6 * ew, -eh, 0, -eh)
      ..close();
  }

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    // Radius of the egg circle (~36% of widget size, matches R=100 in 280px canvas)
    final R = size.width * 0.36;
    // Egg dimensions — 18px egg in 280px canvas → ~6.4% of size
    final eggSize = size.width * 0.064;
    final ew = eggSize * 0.55;
    final eh = eggSize * 0.75;

    final frame = (progress * _n).floor() % _n;

    for (int i = 0; i < _n; i++) {
      final angle = (i / _n) * math.pi * 2 - math.pi / 2;
      final ex = cx + R * math.cos(angle);
      final ey = cy + R * math.sin(angle);
      final glow = _getGlow(i, frame);
      _drawEgg(canvas, ex, ey, glow, ew, eh, eggSize);
    }
  }

  void _drawEgg(
    Canvas canvas,
    double x,
    double y,
    double glow,
    double ew,
    double eh,
    double size,
  ) {
    // ── Radial glow halo ─────────────────────────────────────────────────
    if (glow > 0.05) {
      final haloRadius = size * 1.4;
      final glowPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            color.withValues(alpha: glow * (isDark ? 0.5 : 0.4)),
            color.withValues(alpha: 0),
          ],
        ).createShader(
          Rect.fromCircle(center: Offset(x, y), radius: haloRadius),
        );
      canvas.drawCircle(Offset(x, y), haloRadius, glowPaint);
    }

    // ── Egg body ─────────────────────────────────────────────────────────
    final bodyRect = Rect.fromLTWH(x - ew, y - eh, ew * 2, eh * 2.4);
    final path = _eggPath(ew, eh).shift(Offset(x, y));

    final Paint bodyPaint;
    if (glow > 0.5) {
      // Lit egg — use the provided color with warm highlight
      final lit = color;
      bodyPaint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.lerp(Colors.white, lit, 0.5)!
                .withValues(alpha: 0.5 + glow * 0.5),
            lit.withValues(alpha: 0.4 + glow * 0.5),
            Color.lerp(Colors.black, lit, 0.5)!
                .withValues(alpha: 0.3 + glow * 0.4),
          ],
          stops: const [0.0, 0.5, 1.0],
        ).createShader(bodyRect);
    } else {
      // Dim egg — neutral warm grey
      bodyPaint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  Color.fromRGBO(80, 75, 65, 0.25 + glow * 0.5),
                  Color.fromRGBO(50, 48, 42, 0.2 + glow * 0.3),
                ]
              : [
                  Color.fromRGBO(200, 195, 180, 0.35 + glow * 0.5),
                  Color.fromRGBO(160, 155, 140, 0.3 + glow * 0.4),
                ],
        ).createShader(bodyRect);
    }
    canvas.drawPath(path, bodyPaint);

    // ── Stroke ───────────────────────────────────────────────────────────
    final strokeAlpha = isDark ? (0.15 + glow * 0.4) : (0.15 + glow * 0.35);
    final strokeColor = glow > 0.5
        ? color.withValues(alpha: strokeAlpha)
        : (isDark
            ? Color.fromRGBO(120, 115, 100, strokeAlpha)
            : Color.fromRGBO(130, 125, 110, strokeAlpha));

    canvas.drawPath(
      path,
      Paint()
        ..color = strokeColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.5,
    );
  }

  @override
  bool shouldRepaint(_EggClockPainter old) =>
      old.progress != progress || old.color != color || old.isDark != isDark;
}
