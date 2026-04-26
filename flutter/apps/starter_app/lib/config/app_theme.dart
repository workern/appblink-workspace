import 'package:flutter/material.dart';
import 'package:workern_widgets/theme/antar_design_tokens.dart';
import 'app_colors.dart';
import 'app_tokens.dart';

/// Starter App — theme configuration.
///
/// Extends the shared Workern base theme with Design V2 tokens:
///   - Warm chalk scaffold background (replaces stark white)
///   - Floating snackbars with brand colors
///   - [AppTokens] ThemeExtension for semantic color access anywhere
final class AppTheme {
  const AppTheme._();

  static ThemeData createLightTheme() {
    final base = createMyInternetSupplyTheme(
      colorScheme: AppColors.lightColorScheme,
    );
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.chalk,
      colorScheme: base.colorScheme.copyWith(
        surface: AppColors.chalk,
        surfaceContainerHigh: AppColors.chalk,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.ink,
        contentTextStyle: const TextStyle(
          color: AppColors.chalk,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 4,
      ),
      extensions: const [AppTokens.light],
    );
  }

  static ThemeData createDarkTheme() {
    final base = createMyInternetSupplyTheme(
      colorScheme: AppColors.darkColorScheme,
    );
    return base.copyWith(
      scaffoldBackgroundColor: const Color(0xFF1C1A16),
      colorScheme: base.colorScheme.copyWith(
        surface: const Color(0xFF1C1A16),
        surfaceContainerHigh: const Color(0xFF2A2620),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.mist,
        contentTextStyle: TextStyle(
          color: AppColors.ink,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 4,
      ),
      extensions: const [AppTokens.dark],
    );
  }
}

final appTheme = AppTheme.createLightTheme();
final appDarkTheme = AppTheme.createDarkTheme();
