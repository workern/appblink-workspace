import 'package:flutter/material.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';

/// A generic, reusable full-screen paywall that wraps RevenueCat's native
/// [PaywallView].
///
/// Drop this anywhere you would normally gate content behind a subscription.
///
/// ### Full-screen route
/// ```dart
/// Navigator.of(context).push(
///   MaterialPageRoute(
///     builder: (_) => RevenueCatPaywallScreen(
///       onPurchaseCompleted: () => Navigator.of(context).pop(),
///     ),
///   ),
/// );
/// ```
///
/// ### Embedded in a widget tree
/// ```dart
/// RevenueCatPaywallScreen(
///   embedded: true,
///   onDismiss: () { /* close bottom sheet */ },
/// )
/// ```
class RevenueCatPaywallScreen extends StatelessWidget {
  /// Called when the user dismisses the paywall without purchasing.
  final VoidCallback? onDismiss;

  /// Called when a purchase or restore completes successfully.
  final ValueChanged<PaywallResult>? onPurchaseCompleted;

  /// When `true` the widget renders inline (no [Scaffold] wrapper).
  /// Use this when embedding inside a [BottomSheet] or a [PageView].
  final bool embedded;

  /// Background colour behind the native paywall view.
  /// Defaults to [Colors.black].
  final Color backgroundColor;

  const RevenueCatPaywallScreen({
    super.key,
    this.onDismiss,
    this.onPurchaseCompleted,
    this.embedded = false,
    this.backgroundColor = Colors.black,
  });

  void _handleDismiss(BuildContext context) {
    if (onDismiss != null) {
      onDismiss!();
    } else {
      Navigator.of(context).maybePop();
    }
  }

  void _handleResult(BuildContext context, PaywallResult result) {
    onPurchaseCompleted?.call(result);
    if (result == PaywallResult.purchased || result == PaywallResult.restored) {
      Navigator.of(context).maybePop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final paywallView = PaywallView(
      onDismiss: () => _handleDismiss(context),
      onPurchaseCompleted: (customerInfo, storeTransaction) {
        _handleResult(context, PaywallResult.purchased);
      },
      onRestoreCompleted: (customerInfo) {
        _handleResult(context, PaywallResult.restored);
      },
    );

    if (embedded) return paywallView;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(child: paywallView),
    );
  }
}
