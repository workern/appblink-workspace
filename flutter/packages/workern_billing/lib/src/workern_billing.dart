import 'dart:io';
import 'package:flutter/foundation.dart';
import './config/billing_config.dart';
import './services/billing_service.dart';

/// Top-level entry point for the workern_billing package.
///
/// Call [initialize] once in `main()` before `runApp`, then use the
/// [service] singleton (or Riverpod providers) anywhere in your app.
///
/// ## Setup in main.dart
/// ```dart
/// import 'package:workern_billing/workern_billing.dart';
///
/// void main() async {
///   WidgetsFlutterBinding.ensureInitialized();
///
///   await WorkernBilling.initialize(
///     const WorkernBillingConfig(
///       androidApiKey: 'your_rc_android_key',
///       iosApiKey:    'your_rc_ios_key',
///       entitlementId: 'pro',
///     ),
///   );
///
///   runApp(const ProviderScope(child: MyApp()));
/// }
/// ```
///
/// ## After sign-in
/// ```dart
/// await WorkernBilling.logIn(firebaseUser.uid);
/// ```
///
/// ## After sign-out
/// ```dart
/// await WorkernBilling.logOut();
/// ```
abstract final class WorkernBilling {
  WorkernBilling._();

  /// The underlying [BillingService] singleton.
  static BillingService get service => BillingService.instance;

  /// Initialise RevenueCat using [config].
  ///
  /// This is a no-op if already configured (idempotent – safe to call again
  /// after a hot restart in debug mode).
  ///
  /// Throws [UnsupportedError] on platforms other than Android and iOS.
  static Future<void> initialize(WorkernBillingConfig config) async {
    final String apiKey;

    if (kIsWeb) {
      throw UnsupportedError(
          'workern_billing: RevenueCat is not supported on Web.');
    } else if (Platform.isAndroid) {
      apiKey = config.androidApiKey;
    } else if (Platform.isIOS || Platform.isMacOS) {
      apiKey = config.iosApiKey;
    } else {
      throw UnsupportedError(
        'workern_billing: Unsupported platform ${Platform.operatingSystem}.',
      );
    }

    await BillingService.instance.configure(
      apiKey: apiKey,
      entitlementId: config.entitlementId,
      userId: config.userId,
    );
  }

  /// Log in a RevenueCat user (call after Firebase / your auth sign-in).
  ///
  /// This links purchases to a stable user ID so they persist across devices.
  static Future<void> logIn(String userId) =>
      BillingService.instance.logIn(userId);

  /// Log out of RevenueCat (call on sign-out).
  static Future<void> logOut() => BillingService.instance.logOut();

  /// Present the RevenueCat Paywall modal (full-screen).
  ///
  /// Returns `true` if the user purchased or restored a subscription.
  static Future<bool> presentPaywall() =>
      BillingService.instance.presentPaywall();

  /// Present the RevenueCat Paywall only if the user is not already subscribed.
  ///
  /// [entitlementId] defaults to the one provided in [WorkernBillingConfig].
  static Future<bool> presentPaywallIfNeeded([String? entitlementId]) =>
      BillingService.instance.presentPaywallIfNeeded(entitlementId);

  /// Open RevenueCat Customer Center (self-service subscription management).
  static Future<void> presentCustomerCenter() =>
      BillingService.instance.presentCustomerCenter();

  /// Whether the current user has an active subscription.
  ///
  /// Backed by a [ValueNotifier] — use Riverpod's [isSubscribedProvider] for
  /// reactive UI updates instead.
  static bool get isSubscribed => BillingService.instance.isSubscribed.value;
}
