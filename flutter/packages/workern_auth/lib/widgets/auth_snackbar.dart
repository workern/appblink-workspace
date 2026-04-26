import 'package:flutter/material.dart';

final class AuthSnackBar {
  const AuthSnackBar._();

  static void showError(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 4),
  }) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    final colorScheme = Theme.of(context).colorScheme;

    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message, style: TextStyle(color: colorScheme.onError)),
        backgroundColor: colorScheme.error,
        duration: duration,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
