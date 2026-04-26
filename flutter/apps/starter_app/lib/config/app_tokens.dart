import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Semantic design tokens for Starter App — consumed via [BuildContext.tokens].
///
/// Replace the light/dark concrete values when you brand this starter app.
///
/// Usage:
/// ```dart
/// final t = context.tokens;
/// Container(color: t.surfaceRaised)
/// Text('Hello', style: TextStyle(color: t.textMuted))
/// ```
@immutable
class AppTokens extends ThemeExtension<AppTokens> {
  const AppTokens({
    required this.surfaceBase,
    required this.surfaceRaised,
    required this.surfaceGlass,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.accentPrimary,
    required this.accentSoft,
    required this.borderDefault,
    required this.borderStrong,
  });

  /// App scaffold background.
  final Color surfaceBase;

  /// Cards, sheets, dialogs (elevation.1).
  final Color surfaceRaised;

  /// Translucent overlays — use with `withOpacity` as needed.
  final Color surfaceGlass;

  /// Headlines and primary body copy.
  final Color textPrimary;

  /// Supporting labels, captions.
  final Color textSecondary;

  /// Placeholder, disabled, metadata.
  final Color textMuted;

  /// Brand accent — CTAs, active states, links.
  final Color accentPrimary;

  /// Low-emphasis accent tint background.
  final Color accentSoft;

  /// Subtle card borders and separators.
  final Color borderDefault;

  /// Stronger dividers and focus outlines.
  final Color borderStrong;

  // ── Light preset ──────────────────────────────────────────────────────────
  static const light = AppTokens(
    surfaceBase: AppColors.chalk,
    surfaceRaised: Color(0xFFFFFFFF),
    surfaceGlass: Color(0xCCFAF8F5),
    textPrimary: AppColors.ink,
    textSecondary: Color(0xFF5A5550),
    textMuted: AppColors.stone,
    accentPrimary: AppColors.amber,
    accentSoft: Color(0xFFFFF3E0),
    borderDefault: AppColors.mist,
    borderStrong: AppColors.stone,
  );

  // ── Dark preset ───────────────────────────────────────────────────────────
  static const dark = AppTokens(
    surfaceBase: Color(0xFF1C1A16),
    surfaceRaised: Color(0xFF2A2620),
    surfaceGlass: Color(0xCC1C1A16),
    textPrimary: AppColors.mist,
    textSecondary: Color(0xFFCCC4B8),
    textMuted: Color(0xFF7A7268),
    accentPrimary: Color(0xFFFFB74D),
    accentSoft: Color(0x33FFB74D),
    borderDefault: Color(0xFF3C3830),
    borderStrong: Color(0xFF5C5848),
  );

  @override
  AppTokens copyWith({
    Color? surfaceBase,
    Color? surfaceRaised,
    Color? surfaceGlass,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? accentPrimary,
    Color? accentSoft,
    Color? borderDefault,
    Color? borderStrong,
  }) {
    return AppTokens(
      surfaceBase: surfaceBase ?? this.surfaceBase,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      surfaceGlass: surfaceGlass ?? this.surfaceGlass,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      accentPrimary: accentPrimary ?? this.accentPrimary,
      accentSoft: accentSoft ?? this.accentSoft,
      borderDefault: borderDefault ?? this.borderDefault,
      borderStrong: borderStrong ?? this.borderStrong,
    );
  }

  @override
  AppTokens lerp(AppTokens? other, double t) {
    if (other is! AppTokens) return this;
    return AppTokens(
      surfaceBase: Color.lerp(surfaceBase, other.surfaceBase, t)!,
      surfaceRaised: Color.lerp(surfaceRaised, other.surfaceRaised, t)!,
      surfaceGlass: Color.lerp(surfaceGlass, other.surfaceGlass, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      accentPrimary: Color.lerp(accentPrimary, other.accentPrimary, t)!,
      accentSoft: Color.lerp(accentSoft, other.accentSoft, t)!,
      borderDefault: Color.lerp(borderDefault, other.borderDefault, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
    );
  }
}

extension AppTokensX on BuildContext {
  AppTokens get tokens =>
      Theme.of(this).extension<AppTokens>() ?? AppTokens.light;
}
