import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import '../models/billing_package_model.dart';
import '../services/billing_service.dart';

// ---------------------------------------------------------------------------
// BillingService provider — singleton exposed to Riverpod
// ---------------------------------------------------------------------------
final billingServiceProvider = Provider<BillingService>((_) {
  return BillingService.instance;
});

// ---------------------------------------------------------------------------
// Async packages loader
// ---------------------------------------------------------------------------
final billingPackagesProvider =
    FutureProvider<List<BillingPackageModel>>((ref) async {
  return ref.read(billingServiceProvider).getPackages();
});

// ---------------------------------------------------------------------------
// Customer info — lazy fetched, refreshed on demand
// ---------------------------------------------------------------------------
final customerInfoProvider = FutureProvider<CustomerInfo?>((ref) async {
  return ref.read(billingServiceProvider).getCustomerInfo();
});

// ---------------------------------------------------------------------------
// Subscription status — synced with BillingService.instance.isSubscribed
// ---------------------------------------------------------------------------
final isSubscribedProvider =
    NotifierProvider<IsSubscribedNotifier, bool>(IsSubscribedNotifier.new);

class IsSubscribedNotifier extends Notifier<bool> {
  void _syncFromService() {
    state = ref.read(billingServiceProvider).isSubscribed.value;
  }

  @override
  bool build() {
    final service = ref.read(billingServiceProvider);
    service.isSubscribed.addListener(_syncFromService);
    ref.onDispose(() => service.isSubscribed.removeListener(_syncFromService));
    return service.isSubscribed.value;
  }
}

// ---------------------------------------------------------------------------
// Purchase state
// ---------------------------------------------------------------------------
enum PurchaseState { idle, loading, success, error, cancelled }

final purchaseStateProvider =
    NotifierProvider<PurchaseStateNotifier, PurchaseState>(
  PurchaseStateNotifier.new,
);

class PurchaseStateNotifier extends Notifier<PurchaseState> {
  String? errorMessage;

  @override
  PurchaseState build() => PurchaseState.idle;

  Future<void> purchase(BillingPackageModel package) async {
    state = PurchaseState.loading;
    errorMessage = null;
    try {
      final service = ref.read(billingServiceProvider);
      final success = await service.purchasePackage(package);
      state = success ? PurchaseState.success : PurchaseState.cancelled;
    } catch (e) {
      errorMessage = e.toString();
      state = PurchaseState.error;
    }
  }

  Future<void> restore() async {
    state = PurchaseState.loading;
    errorMessage = null;
    try {
      final service = ref.read(billingServiceProvider);
      final restored = await service.restorePurchases();
      state = restored ? PurchaseState.success : PurchaseState.idle;
    } catch (e) {
      errorMessage = e.toString();
      state = PurchaseState.error;
    }
  }

  void reset() => state = PurchaseState.idle;
}
