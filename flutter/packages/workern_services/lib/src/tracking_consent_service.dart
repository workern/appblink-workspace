import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:app_tracking_transparency/app_tracking_transparency.dart';

/// Handles App Tracking Transparency (ATT) consent on iOS 14.5+.
///
/// Apple requires apps to ask permission before tracking users across apps
/// and websites. This service shows a friendly pre-prompt explaining WHY
/// we need tracking before triggering the system ATT dialog.
///
/// Usage (call once at app startup, e.g. after splash):
/// ```dart
/// await TrackingConsentService.requestTrackingIfNeeded(context);
/// ```
class TrackingConsentService {
  TrackingConsentService._();

  /// Request tracking authorization on iOS.
  ///
  /// Flow:
  ///   1. Check current status — if already determined, skip the dialogs.
  ///   2. Show a branded pre-prompt dialog explaining the reason.
  ///   3. On user confirmation, trigger the native iOS ATT system dialog.
  ///
  /// On non-iOS platforms this is a no-op.
  /// Returns the final [TrackingStatus] (or [TrackingStatus.notSupported] on
  /// Android / web).
  static Future<TrackingStatus> requestTrackingIfNeeded(
    BuildContext context,
  ) async {
    // Only relevant on iOS
    if (defaultTargetPlatform != TargetPlatform.iOS) {
      return TrackingStatus.notSupported;
    }

    // Check if already determined to avoid showing the dialog again
    final current = await AppTrackingTransparency.trackingAuthorizationStatus;
    if (current != TrackingStatus.notDetermined) {
      debugPrint('📊 ATT: status already determined — $current');
      return current;
    }

    // Small delay recommended by Apple to avoid showing dialog during
    // launch animation (prevents rejection during App Review)
    await Future<void>.delayed(const Duration(milliseconds: 200));

    if (!context.mounted) return TrackingStatus.notDetermined;

    // Step 1: Show our own pre-prompt explaining the purpose
    final userAgreedToSeeDialog = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const _TrackingPrePromptDialog(),
    );

    if (userAgreedToSeeDialog != true) {
      debugPrint('📊 ATT: user dismissed pre-prompt without allowing');
      return TrackingStatus.denied;
    }

    // Step 2: Trigger the native iOS ATT dialog
    final status = await AppTrackingTransparency.requestTrackingAuthorization();
    debugPrint('📊 ATT: system dialog result — $status');
    return status;
  }
}

/// Branded pre-prompt dialog shown BEFORE the native iOS ATT dialog.
/// Explains in plain language why tracking benefits the user.
class _TrackingPrePromptDialog extends StatelessWidget {
  const _TrackingPrePromptDialog();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Icons.privacy_tip_outlined,
                size: 32,
                color: colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              'Help Us Reach More People',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),

            // Body
            Text(
              'We use ads to introduce our app to new users who might love it.\n\n'
              'Enabling tracking helps us:\n'
              '• Show our ads to the right audience\n'
              '• Improve our advertising campaigns\n'
              '• Accurately measure new installs\n\n'
              'We never sell your data. Tracking is only used to make our ads more relevant.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
              textAlign: TextAlign.left,
            ),
            const SizedBox(height: 24),

            // CTA — triggers native ATT dialog
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Continue'),
              ),
            ),
            const SizedBox(height: 8),

            // Decline link
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Not now',
                style: TextStyle(color: colorScheme.outline),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
