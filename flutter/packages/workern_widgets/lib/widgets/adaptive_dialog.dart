import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// A widget that displays an adaptive dialog that looks native on both Material (Android)
/// and Cupertino (iOS) platforms.
///
/// Example:
/// ```dart
/// final result = await showAdaptiveDialog<bool>(
///   context: context,
///   title: 'Confirm Action',
///   content: 'Are you sure you want to proceed?',
///   actions: [
///     AdaptiveDialogAction(label: 'Cancel', onPressed: () => Navigator.pop(context, false)),
///     AdaptiveDialogAction(label: 'Yes', onPressed: () => Navigator.pop(context, true), isDestructive: true),
///   ],
/// );
/// ```
class AdaptiveDialogAction {
  final String label;
  final VoidCallback onPressed;
  final bool isDestructive;
  final bool isDefaultAction;

  const AdaptiveDialogAction({
    required this.label,
    required this.onPressed,
    this.isDestructive = false,
    this.isDefaultAction = false,
  });
}

/// Shows an adaptive dialog based on the current platform
///
/// Parameters:
/// - [context]: The build context
/// - [title]: The title of the dialog
/// - [content]: The content/body of the dialog (can be String or Widget)
/// - [actions]: List of [AdaptiveDialogAction] for the dialog buttons
/// - [barrierDismissible]: Whether tapping outside closes the dialog (default: true)
/// - [contentPadding]: Padding around the content (Material only)
Future<T?> showAdaptiveDialog<T>({
  required BuildContext context,
  required String title,
  required dynamic content, // String or Widget
  required List<AdaptiveDialogAction> actions,
  bool barrierDismissible = true,
  EdgeInsets contentPadding = const EdgeInsets.fromLTRB(24.0, 20.0, 24.0, 24.0),
}) {
  final contentWidget = content is String
      ? Text(content)
      : content is Widget
      ? content
      : const SizedBox.shrink();

  final isCupertinoPlatform =
      Theme.of(context).platform == TargetPlatform.iOS || Platform.isIOS;

  if (isCupertinoPlatform) {
    return showCupertinoDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) => CupertinoAlertDialog(
        title: Text(title),
        content: contentWidget,
        actions: [
          for (final action in actions)
            CupertinoDialogAction(
              onPressed: action.onPressed,
              isDestructiveAction: action.isDestructive,
              isDefaultAction: action.isDefaultAction,
              child: Text(action.label),
            ),
        ],
      ),
    );
  } else {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: contentWidget,
        contentPadding: contentPadding,
        actions: [
          for (final action in actions)
            TextButton(
              onPressed: action.onPressed,
              child: Text(
                action.label,
                style: TextStyle(
                  color: action.isDestructive ? Colors.red : Colors.blue,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Shows any custom dialog widget adaptively.
///
/// On iOS, uses [showCupertinoDialog] so the native frosted-glass backdrop is
/// preserved. On Android/other platforms, uses [showDialog].
///
/// The [builder] must return the dialog widget itself (e.g. a
/// [CupertinoAlertDialog] on iOS or a [Dialog] on Android). Use
/// [Platform.isIOS] / [TargetPlatform.iOS] inside the builder if you need to
/// differentiate rendering, or use a single widget that handles both (like a
/// widget that returns [CupertinoAlertDialog] on iOS and [Dialog] on Android).
///
/// Example:
/// ```dart
/// await showAdaptiveWidgetDialog(
///   context: context,
///   builder: (ctx) => AddNoteDialog(onSave: ...),
/// );
/// ```
Future<T?> showAdaptiveWidgetDialog<T>({
  required BuildContext context,
  required Widget Function(BuildContext) builder,
  bool barrierDismissible = true,
}) {
  final isIOS =
      Theme.of(context).platform == TargetPlatform.iOS || Platform.isIOS;

  if (isIOS) {
    return showCupertinoDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: builder,
    );
  } else {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: builder,
    );
  }
}

/// A simple adaptive confirmation dialog
///
/// Returns `true` if confirmed, `false` if cancelled.
///
/// Pass [onConfirm] to run an async operation while showing a loader inside
/// the confirm button. The dialog closes automatically on success. On error,
/// [onConfirm] should rethrow so the loader resets and the user can retry.
Future<bool> showAdaptiveConfirmationDialog({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'Yes',
  String cancelLabel = 'Cancel',
  bool isDestructive = false,
  Future<void> Function()? onConfirm,
}) async {
  if (onConfirm != null) {
    await showAdaptiveWidgetDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _ConfirmationDialogWithLoader(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        isDestructive: isDestructive,
        onConfirm: onConfirm,
      ),
    );
    return true;
  }

  final result = await showAdaptiveDialog<bool>(
    context: context,
    title: title,
    content: message,
    actions: [
      AdaptiveDialogAction(
        label: cancelLabel,
        onPressed: () => Navigator.pop(context, false),
      ),
      AdaptiveDialogAction(
        label: confirmLabel,
        onPressed: () => Navigator.pop(context, true),
        isDestructive: isDestructive,
        isDefaultAction: true,
      ),
    ],
  );

  return result ?? false;
}

/// Internal stateful dialog that shows a loader inside the confirm button
/// while [onConfirm] is running.
class _ConfirmationDialogWithLoader extends StatefulWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;
  final Future<void> Function() onConfirm;

  const _ConfirmationDialogWithLoader({
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.isDestructive,
    required this.onConfirm,
  });

  @override
  State<_ConfirmationDialogWithLoader> createState() =>
      _ConfirmationDialogWithLoaderState();
}

class _ConfirmationDialogWithLoaderState
    extends State<_ConfirmationDialogWithLoader> {
  bool _isLoading = false;

  bool get _isIOS =>
      Platform.isIOS || Theme.of(context).platform == TargetPlatform.iOS;

  Future<void> _handleConfirm() async {
    setState(() => _isLoading = true);
    try {
      await widget.onConfirm();
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      // onConfirm handles its own error reporting; reset the loader so the
      // user can retry or cancel.
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isIOS ? _buildCupertino() : _buildMaterial();
  }

  Widget _buildCupertino() {
    return CupertinoAlertDialog(
      title: Text(widget.title),
      content: Text(widget.message),
      actions: [
        CupertinoDialogAction(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: Text(widget.cancelLabel),
        ),
        CupertinoDialogAction(
          isDefaultAction: true,
          isDestructiveAction: widget.isDestructive,
          onPressed: _isLoading ? null : _handleConfirm,
          child: _isLoading
              ? const CupertinoActivityIndicator()
              : Text(widget.confirmLabel),
        ),
      ],
    );
  }

  Widget _buildMaterial() {
    return AlertDialog(
      title: Text(widget.title),
      content: Text(widget.message),
      actions: [
        ShadButton.outline(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: Text(widget.cancelLabel),
        ),
        if (widget.isDestructive)
          ShadButton.destructive(
            onPressed: _isLoading ? null : _handleConfirm,
            child: _isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(widget.confirmLabel),
          )
        else
          ShadButton(
            onPressed: _isLoading ? null : _handleConfirm,
            child: _isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(widget.confirmLabel),
          ),
      ],
    );
  }
}
