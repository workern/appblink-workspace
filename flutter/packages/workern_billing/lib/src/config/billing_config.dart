/// Configuration for WorkernBilling.
///
/// Pass an instance to [WorkernBilling.initialize] once in your app's
/// `main()` before calling `runApp`.
///
/// ```dart
/// await WorkernBilling.initialize(
///   WorkernBillingConfig(
///     androidApiKey: 'your_rc_android_key',
///     iosApiKey: 'your_rc_ios_key',
///     entitlementId: 'pro',
///   ),
/// );
/// ```
class WorkernBillingConfig {
  /// RevenueCat public API key for Android.
  final String androidApiKey;

  /// RevenueCat public API key for iOS.
  final String iosApiKey;

  /// The RevenueCat entitlement identifier that represents an active
  /// subscription/purchase (e.g. `'pro'`, `'save-nest-pro'`).
  final String entitlementId;

  /// Optional RevenueCat user ID to associate purchases with a specific user.
  /// When null, RevenueCat uses an anonymous ID until [WorkernBilling.logIn]
  /// is called.
  final String? userId;

  const WorkernBillingConfig({
    required this.androidApiKey,
    required this.iosApiKey,
    required this.entitlementId,
    this.userId,
  });
}
