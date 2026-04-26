import 'package:flutter/material.dart';

/// Starter App — design token color palette.
///
/// Teams should replace the brand swatches (amber, slate…) with their own
/// brand palette. Semantic aliases (primary, success, etc.) guarantee that
/// individual widget code never needs to change when the brand is swapped.
class AppColors {
  const AppColors._();

  // ── Brand palette ────────────────────────────────────────────────────────
  static const Color amber     = Color(0xFFFF9933); // warm orange brand
  static const Color chalk     = Color(0xFFFAF8F5); // warm off-white surface
  static const Color ink       = Color(0xFF2D3142); // deep navy-slate text
  static const Color mist      = Color(0xFFEBE8E4); // subtle warm border/card
  static const Color stone     = Color(0xFFA09890); // muted warm gray
  static const Color ember     = Color(0xFFE07720); // darker amber — pressed/hover

  // ── Convenience accessor ─────────────────────────────────────────────────
  static const Color primary   = amber;

  // ── Semantic status colors ───────────────────────────────────────────────
  static const Color success   = Color(0xFF4CAF50);
  static const Color onSuccess = Color(0xFFFFFFFF);
  static const Color warning   = Color(0xFFF59E0B);
  static const Color onWarning = Color(0xFFFFFFFF);
  static const Color error     = Color(0xFFD32F2F);
  static const Color onError   = Color(0xFFFFFFFF);

  // ── Light ColorScheme ────────────────────────────────────────────────────
  static const ColorScheme lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: amber,
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFFFF3E0),
    onPrimaryContainer: ink,
    secondary: ember,
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: mist,
    onSecondaryContainer: ink,
    tertiary: stone,
    onTertiary: Color(0xFFFFFFFF),
    tertiaryContainer: chalk,
    onTertiaryContainer: ink,
    error: error,
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFFEBEE),
    onErrorContainer: Color(0xFF7F1D1D),
    outline: stone,
    outlineVariant: mist,
    surface: Color(0xFFFFFFFF),
    onSurface: ink,
    surfaceVariant: mist,
    onSurfaceVariant: ink,
    inverseSurface: ink,
    onInverseSurface: chalk,
    inversePrimary: ember,
    scrim: Color(0xFF000000),
  );

  // ── Dark ColorScheme ─────────────────────────────────────────────────────
  static const ColorScheme darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: Color(0xFFFFB74D),   // lightened amber for dark
    onPrimary: Color(0xFF1A0D00),
    primaryContainer: Color(0xFF3A2200),
    onPrimaryContainer: Color(0xFFFFDDB0),
    secondary: Color(0xFFFFCC80),
    onSecondary: Color(0xFF1A1000),
    secondaryContainer: Color(0xFF2E1E00),
    onSecondaryContainer: Color(0xFFFFE0A8),
    tertiary: Color(0xFFBCB0A8),
    onTertiary: Color(0xFF1A1410),
    tertiaryContainer: Color(0xFF2E2820),
    onTertiaryContainer: Color(0xFFD8CCC4),
    error: Color(0xFFFFB4AB),
    onError: Color(0xFF2A0505),
    errorContainer: Color(0xFF4A1515),
    onErrorContainer: Color(0xFFFFD0CC),
    outline: Color(0xFF7A7268),
    outlineVariant: Color(0xFF3C3830),
    surface: Color(0xFF1C1A16),
    onSurface: mist,
    surfaceVariant: Color(0xFF2E2A24),
    onSurfaceVariant: Color(0xFFCCC4B8),
    inverseSurface: mist,
    onInverseSurface: ink,
    inversePrimary: amber,
    scrim: Color(0xFF000000),
  );
}
