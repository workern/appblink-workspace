// ignore_for_file: unused_import
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:purchases_ui_flutter/purchases_ui_flutter.dart';
import '../models/billing_package_model.dart';

/// Singleton service wrapping RevenueCat for in-app purchases.
///
/// Setup:
///   1. Call [configure] once on app start.
///   2. Set [entitlementId] to your RevenueCat entitlement key.
///   3. Call [getPackages] to load offerings.
///   4. Call [purchasePackage] to trigger purchase UI.
class BillingService {
  BillingService._();
  static final BillingService instance = BillingService._();

  bool _configured = false;
  String? _entitlementId;

  /// Whether the current user has an active subscription.
  final ValueNotifier<bool> isSubscribed = ValueNotifier(false);

  /// Configure RevenueCat. Call once on app start with your RC API key.
  Future<void> configure({
    required String apiKey,
    String? entitlementId,
    String? userId,
  }) async {
    if (_configured) {
      debugPrint('⚡ BillingService already configured, skipping.');
      return;
    }
    try {
      await Purchases.setLogLevel(
        kReleaseMode ? LogLevel.error : LogLevel.debug,
      );
      await Purchases.configure(PurchasesConfiguration(apiKey));
      if (userId != null) {
        await Purchases.logIn(userId);
      }
      if (entitlementId != null) {
        _entitlementId = entitlementId;
      }
      Purchases.addCustomerInfoUpdateListener(_onCustomerInfoUpdated);
      _configured = true;
      await _refreshSubscriptionStatus();
      debugPrint('✅ BillingService configured');
    } catch (e) {
      debugPrint('❌ BillingService configure error: $e');
      rethrow;
    }
  }

  /// Override the entitlement key at runtime.
  set entitlementId(String id) => _entitlementId = id;

  /// Fetch available packages from the current RevenueCat offering.
  Future<List<BillingPackageModel>> getPackages() async {
    _assertConfigured();
    try {
      final offerings = await Purchases.getOfferings();
      final packages = offerings.current?.availablePackages ?? [];
      return packages.map(BillingPackageModel.fromPackage).toList();
    } on PlatformException catch (e) {
      debugPrint('❌ getPackages error: $e');
      rethrow;
    }
  }

  /// Trigger the Play Store / App Store purchase sheet.
  /// Returns true on success, false if user cancelled.
  Future<bool> purchasePackage(BillingPackageModel model) async {
    _assertConfigured();
    try {
      await Purchases.purchasePackage(model.revenueCatPackage);
      return true;
    } on PurchasesError catch (e) {
      if (e.code == PurchasesErrorCode.purchaseCancelledError) {
        return false;
      }
      debugPrint('❌ PurchasesError: ${e.message}');
      rethrow;
    } on PlatformException catch (e) {
      debugPrint('❌ PlatformException: $e');
      rethrow;
    }
  }

  /// Restore previously purchased subscriptions.
  /// Returns true if an active subscription was found.
  Future<bool> restorePurchases() async {
    _assertConfigured();
    try {
      final info = await Purchases.restorePurchases();
      _onCustomerInfoUpdated(info);
      return isSubscribed.value;
    } on PlatformException catch (e) {
      debugPrint('❌ restorePurchases error: $e');
      rethrow;
    }
  }

  /// Log in a user to RevenueCat (call after Firebase sign-in).
  Future<void> logIn(String userId) async {
    if (!_configured) return;
    await Purchases.logIn(userId);
    await _refreshSubscriptionStatus();
  }

  /// Log out (call on Firebase sign-out).
  Future<void> logOut() async {
    if (!_configured) return;
    try {
      await Purchases.logOut();
    } catch (_) {}
    isSubscribed.value = false;
  }

  /// Returns the RevenueCat subscription management URL (deep-link to manage plan).
  Future<String?> getManagementUrl() async {
    try {
      final info = await Purchases.getCustomerInfo();
      return info.managementURL;
    } catch (_) {
      return null;
    }
  }

  /// Returns current [CustomerInfo] or null on error.
  /// Also updates [isSubscribed] so Riverpod providers reflect the latest state.
  Future<CustomerInfo?> getCustomerInfo() async {
    try {
      final info = await Purchases.getCustomerInfo();
      _onCustomerInfoUpdated(info);
      return info;
    } catch (e) {
      debugPrint('❌ getCustomerInfo error: $e');
      return null;
    }
  }

  /// Present the RevenueCat Paywall for the current offering.
  /// Returns true if the user purchased or restored a subscription.
  Future<bool> presentPaywall() async {
    _assertConfigured();
    final result = await RevenueCatUI.presentPaywall();
    return result == PaywallResult.purchased || result == PaywallResult.restored;
  }

  /// Present the RevenueCat Paywall only if the user does NOT have the
  /// [entitlementId] entitlement active. Returns true if subscribed after.
  Future<bool> presentPaywallIfNeeded([String? entitlementId]) async {
    _assertConfigured();
    final id = entitlementId ?? _entitlementId ?? 'pro';
    final result = await RevenueCatUI.presentPaywallIfNeeded(id);
    return result == PaywallResult.purchased || result == PaywallResult.restored;
  }

  /// Open the RevenueCat Customer Center (subscription management self-service).
  Future<void> presentCustomerCenter() async {
    _assertConfigured();
    await RevenueCatUI.presentCustomerCenter();
  }

  Future<void> _refreshSubscriptionStatus() async {
    try {
      final info = await Purchases.getCustomerInfo();
      _onCustomerInfoUpdated(info);
    } catch (e) {
      debugPrint('❌ _refreshSubscriptionStatus: $e');
    }
  }

  void _onCustomerInfoUpdated(CustomerInfo info) {
    final entitlement = _entitlementId;
    if (entitlement != null) {
      isSubscribed.value = info.entitlements.active.containsKey(entitlement);
    } else {
      isSubscribed.value = info.entitlements.active.isNotEmpty;
    }
    debugPrint('💳 isSubscribed: ${isSubscribed.value}');
  }

  void _assertConfigured() {
    if (!_configured) {
      throw StateError(
        'BillingService not configured. Call BillingService.instance.configure() first.',
      );
    }
  }
}
