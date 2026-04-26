import 'package:flutter/material.dart';

@immutable
class WorkernSnackbarTheme extends ThemeExtension<WorkernSnackbarTheme> {
  const WorkernSnackbarTheme({
    required this.background,
    required this.foreground,
    this.shape,
    this.elevation,
    this.behavior,
  });

  final Color background;
  final Color foreground;
  final ShapeBorder? shape;
  final double? elevation;
  final SnackBarBehavior? behavior;

  static WorkernSnackbarTheme fallbackFromTheme(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    final snackBarTheme = theme.snackBarTheme;

    return WorkernSnackbarTheme(
        background: snackBarTheme.backgroundColor ?? colorScheme.inverseSurface,
        foreground:
          snackBarTheme.contentTextStyle?.color ?? colorScheme.onInverseSurface,
      shape:
          snackBarTheme.shape ??
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: snackBarTheme.elevation ?? 4,
      behavior: snackBarTheme.behavior ?? SnackBarBehavior.floating,
    );
  }

  @override
  WorkernSnackbarTheme copyWith({
    Color? background,
    Color? foreground,
    ShapeBorder? shape,
    double? elevation,
    SnackBarBehavior? behavior,
  }) {
    return WorkernSnackbarTheme(
      background: background ?? this.background,
      foreground: foreground ?? this.foreground,
      shape: shape ?? this.shape,
      elevation: elevation ?? this.elevation,
      behavior: behavior ?? this.behavior,
    );
  }

  @override
  WorkernSnackbarTheme lerp(
    covariant ThemeExtension<WorkernSnackbarTheme>? other,
    double t,
  ) {
    if (other is! WorkernSnackbarTheme) return this;

    return WorkernSnackbarTheme(
      background: Color.lerp(background, other.background, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      shape: t < 0.5 ? shape : other.shape,
      elevation: t < 0.5 ? elevation : other.elevation,
      behavior: t < 0.5 ? behavior : other.behavior,
    );
  }
}

/// Reusable snackbar API for Workern Flutter apps.
final class WorkernSnackbar {
  const WorkernSnackbar._();

  static void showRaw(
    BuildContext context,
    SnackBar snackBar, {
    bool clearExisting = true,
  }) {
    final messenger = ScaffoldMessenger.of(context);
    if (clearExisting) {
      messenger.hideCurrentSnackBar();
    }
    messenger.showSnackBar(snackBar);
  }

  static void show(
    BuildContext context,
    String message, {
    Duration? duration,
    bool clearExisting = true,
  }) {
    final resolvedTheme = _resolvedTheme(context);

    final snackBar = SnackBar(
      content: Text(
        message,
        style: Theme.of(context).snackBarTheme.contentTextStyle?.copyWith(
              color: resolvedTheme.foreground,
            ) ??
            TextStyle(
              color: resolvedTheme.foreground,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
      ),
      duration: duration ?? const Duration(seconds: 4),
      backgroundColor: resolvedTheme.background,
      shape: resolvedTheme.shape,
      elevation: resolvedTheme.elevation,
      behavior: resolvedTheme.behavior,
    );

    showRaw(context, snackBar, clearExisting: clearExisting);
  }

  static WorkernSnackbarTheme _resolvedTheme(BuildContext context) {
    final theme = Theme.of(context);
    return theme.extension<WorkernSnackbarTheme>() ??
      WorkernSnackbarTheme.fallbackFromTheme(theme);
  }
}
