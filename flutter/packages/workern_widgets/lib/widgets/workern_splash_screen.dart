import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';
import 'workern_ambient_background.dart';

/// A reusable animated splash screen shown while auth state is loading.
///
/// Animation sequence (2 400 ms total):
///   Phase 1 (0 – 30 %) : Logo drops from above screen with elastic bounce.
///   Phase 2 (30 – 52 %): Logo slides left into its row position.
///   Phase 3 (38 – 57 %): App name text slides in from the right.
///   Phase 4 (60 – 78 %): Tagline fades in at the bottom.
///
/// Respects [MediaQueryData.disableAnimations] for reduced-motion accessibility.
///
/// Example usage:
/// ```dart
/// WorkernSplashScreen(
///   logo: Image.asset('assets/icons/icon_1024.png', width: 84, height: 84),
///   appNameFirstLine: 'Save',
///   appNameSecondLine: 'Nest',
///   tagline: 'Save anything. Find it instantly with AI.',
///   primaryColor: Colors.deepOrange,
///   backgroundColor: const Color(0xFFFAF7F2),
/// )
/// ```
class WorkernSplashScreen extends StatefulWidget {
  /// The logo widget displayed in the animation. Typically an [Image] or [Icon].
  final Widget logo;

  /// First line of the app name (displayed in [textColor]).
  final String appNameFirstLine;

  /// Optional second line of the app name (displayed in [primaryColor]).
  /// If null, only [appNameFirstLine] is shown.
  final String? appNameSecondLine;

  /// Short tagline shown at the bottom.
  final String tagline;

  /// Callback when the animation completes.
  final VoidCallback? onAnimationComplete;

  /// Accent color used for [appNameSecondLine] and the logo shadow.
  final Color primaryColor;

  /// Screen background color. If null, defaults to a dynamic theme-based background.
  final Color? backgroundColor;

  /// Color for [appNameFirstLine]. If null, defaults to a dynamic theme-based text color.
  final Color? textColor;

  /// The route to navigate to after animation/loading completes.
  final String nextRoute;

  const WorkernSplashScreen({
    super.key,
    required this.logo,
    required this.appNameFirstLine,
    this.appNameSecondLine,
    required this.tagline,
    this.onAnimationComplete,
    required this.primaryColor,
    this.backgroundColor,
    this.textColor,
    this.nextRoute = '/login',
  });

  @override
  State<WorkernSplashScreen> createState() => _WorkernSplashScreenState();
}

class _WorkernSplashScreenState extends State<WorkernSplashScreen>
    with SingleTickerProviderStateMixin {
  // ── Brand-row layout constants ─────────────────────────────────────────────
  static const double _logoSize = 84.0;
  static const double _gap = 18.0;
  static const double _textBlockW = 180.0;
  static const double _rowW = _logoSize + _gap + _textBlockW; // 282

  /// Logo center-X offset from screen center when the row is centered.
  static const double _logoFinalX = -(_rowW / 2 - _logoSize / 2); // −99

  /// Text widget center-X offset from screen center when the row is centered.
  static const double _textFinalX = _rowW / 2 - _textBlockW / 2; // 51

  late final AnimationController _ctrl;

  late final Animation<double> _dropProgress;
  late final Animation<double> _logoShiftProgress;
  late final Animation<double> _textSlideProgress;
  late final Animation<double> _textAlphaProgress;
  late final Animation<double> _taglineAlphaProgress;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _dropProgress = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.0, 0.40, curve: Curves.elasticOut),
    );

    _logoShiftProgress = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.40, 0.70, curve: Curves.easeInOut),
    );

    _textSlideProgress = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.50, 0.85, curve: Curves.easeOut),
    );

    _textAlphaProgress = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.50, 0.75, curve: Curves.easeOut),
    );

    _taglineAlphaProgress = CurvedAnimation(
      parent: _ctrl,
      curve: const Interval(0.75, 1.0, curve: Curves.easeOut),
    );

    _ctrl.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onAnimationComplete?.call();
      }
    });

    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final resolvedBg = widget.backgroundColor ?? 
        (isDark ? const Color(0xFF09090B) : const Color(0xFFFAF9F6));
    final resolvedTextColor = widget.textColor ?? 
        (isDark ? const Color(0xFFF4F4F5) : const Color(0xFF18181B));

    if (MediaQuery.of(context).disableAnimations) {
      return _buildStatic(resolvedBg, resolvedTextColor, isDark);
    }

    final screenH = MediaQuery.sizeOf(context).height;

    return Scaffold(
      backgroundColor: resolvedBg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          _buildBackground(resolvedBg),
          SafeArea(
            child: AnimatedBuilder(
              animation: _ctrl,
              builder: (context, _) => Center(
                child: SizedBox.expand(child: _buildAnimatedBody(screenH, resolvedTextColor, isDark)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedBody(double screenH, Color resolvedTextColor, bool isDark) {
    final dropStart = -(screenH / 2 + _logoSize + 24);
    final logoY = lerpDouble(dropStart, 0.0, _dropProgress.value)!;
    final logoX = lerpDouble(0.0, _logoFinalX, _logoShiftProgress.value)!;

    final textX = lerpDouble(
      _textFinalX + 260.0,
      _textFinalX,
      _textSlideProgress.value,
    )!;
    final textAlpha = _textAlphaProgress.value.clamp(0.0, 1.0);
    final taglineAlpha = _taglineAlphaProgress.value.clamp(0.0, 1.0);

    return Stack(
      alignment: Alignment.center,
      children: [
        Transform.translate(offset: Offset(logoX, logoY), child: _buildLogo(isDark)),
        Transform.translate(
          offset: Offset(textX, 0.0),
          child: Opacity(opacity: textAlpha, child: _buildAppName(resolvedTextColor)),
        ),
        Positioned(
          bottom: 52,
          left: 32,
          right: 32,
          child: Opacity(
            opacity: taglineAlpha,
            child: Center(child: _buildTagline(resolvedTextColor)),
          ),
        ),
      ],
    );
  }

  Widget _buildBackground(Color resolvedBg) {
    return Positioned.fill(
      child: WorkernAmbientBackground(
        backgroundColor: resolvedBg,
      ),
    );
  }

  Widget _buildLogo(bool isDark) {
    return Container(
      width: _logoSize,
      height: _logoSize,
      decoration: BoxDecoration(
        color: isDark 
            ? const Color(0xFF1C1A20) // Deep elevated dark surface
            : Colors.white,           // Clean white light surface
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.black.withValues(alpha: 0.04),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: widget.primaryColor.withValues(alpha: isDark ? 0.35 : 0.15),
            blurRadius: 32,
            spreadRadius: 1,
            offset: const Offset(0, 12),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(12.0), // beautiful modern padding so the icon/image has breathing room
            child: FittedBox(
              fit: BoxFit.contain,
              child: SizedBox(
                width: _logoSize,
                height: _logoSize,
                child: widget.logo,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppName(Color resolvedTextColor) {
    return SizedBox(
      width: _textBlockW,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.appNameFirstLine,
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.w800,
              color: resolvedTextColor,
              letterSpacing: -0.8,
              height: 1.0,
            ),
          ),
          if (widget.appNameSecondLine != null)
            Text(
              widget.appNameSecondLine!,
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w800,
                color: widget.primaryColor,
                letterSpacing: -0.8,
                height: 1.05,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTagline(Color resolvedTextColor) {
    return Text(
      widget.tagline,
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: resolvedTextColor.withValues(alpha: 0.5),
        letterSpacing: 0.2,
      ),
    );
  }

  Widget _buildStatic(Color resolvedBg, Color resolvedTextColor, bool isDark) {
    return Scaffold(
      backgroundColor: resolvedBg,
      body: Stack(
        children: [
          _buildBackground(resolvedBg),
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _buildLogo(isDark),
                const SizedBox(width: _gap),
                _buildAppName(resolvedTextColor),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
