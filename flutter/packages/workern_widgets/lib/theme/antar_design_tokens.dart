/// ANTAR Ecosystem Design Tokens
/// Sanskrit: अंतर (Inner/Within)
/// Philosophy: From Compulsiveness to Consciousness
///
/// Usage: Import this in your app's theme configuration
/// import 'package:workern_widgets/theme/antar_design_tokens.dart';

import 'package:flutter/material.dart';

import 'antar_typography.dart';

/// Sacred Geometry Spacing
/// Based on multiples of 8px (sacred number)
class AntarSpacing {
  AntarSpacing._();

  static const double s0 = 0.0;
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s5 = 20.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;
  static const double s10 = 40.0;
  static const double s12 = 48.0;
  static const double s16 = 64.0;
}

/// Organic Border Radius
class AntarRadius {
  AntarRadius._();

  static const double xs = 4.0;
  static const double sm = 6.0;
  static const double md = 10.0;
  static const double lg = 14.0;
  static const double xl = 18.0;
  static const double full = 9999.0;
}

/// Mindful Animation Durations
class AntarDurations {
  AntarDurations._();

  static const Duration fast = Duration(milliseconds: 120);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 320);
  static const Duration emphasized = Duration(milliseconds: 500);
}

ThemeData createMyInternetSupplyTheme({required ColorScheme colorScheme}) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    textTheme: AntarTypography.textTheme,
    fontFamily: AntarTypography.fontFamily,
    appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
    cardTheme: CardThemeData(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AntarRadius.md),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AntarRadius.md),
        borderSide: BorderSide.none,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: AntarSpacing.s4,
          vertical: AntarSpacing.s2,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AntarRadius.md),
        ),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AntarRadius.lg),
      ),
    ),
  );
}
