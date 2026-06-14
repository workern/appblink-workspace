import 'package:flutter/material.dart';
import 'config/app_router.dart';
import 'config/app_theme.dart';
import 'config/auth_config.dart';
import 'firebase_options.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workern_notifications/workern_notifications.dart';
import 'package:workern_services/workern_services.dart';
import 'package:workern_share_intent/workern_share_intent.dart';
import 'package:workern_billing/workern_billing.dart';
import 'services/starter_app_notification_handler.dart';
import 'package:workern_auth/workern_auth.dart' as app_auth;
import 'package:shadcn_ui/shadcn_ui.dart';
import 'config/app_router.dart' show routerProvider;

// TODO: Replace with your actual RevenueCat API keys from https://app.revenuecat.com
// TODO: Replace 'your-app-pro' with your app's entitlement identifier
const _billingConfig = WorkernBillingConfig(
  androidApiKey: 'YOUR_REVENUECAT_ANDROID_API_KEY',
  iosApiKey: 'YOUR_REVENUECAT_IOS_API_KEY',
  entitlementId: 'your-app-pro',
);

void main() async {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  // Keep the native splash visible while we initialize.
  binding.deferFirstFrame();
  try {
    await Future.wait([
      FirebaseInitializer.initialize(
        FirebaseInitConfig(
          firebaseOptions: DefaultFirebaseOptions.currentPlatform,
          googleClientId: GOOGLE_CLIENT_ID,
          backgroundMessageHandler: workernFirebaseMessagingBackgroundHandler,
          useEmulators: false,
        ),
      ),
      WorkernBilling.initialize(_billingConfig),
    ]);
  } catch (e) {
    debugPrint('❌ Initialization error: $e');
  } finally {
    binding.allowFirstFrame();
  }
  runApp(const ProviderScope(child: StarterApp()));
}

final firebaseUserProvider = app_auth.firebaseUserProvider;

class NotificationServiceParams {
  final NotificationHandler handler;
  final String spaceId;
  NotificationServiceParams({required this.handler, required this.spaceId});
}

final notificationServiceProvider = Provider.autoDispose<void>((ref) {
  final firebaseUser = ref.watch(firebaseUserProvider);
  if (firebaseUser != null) {
    WorkernNotificationService.initialize(
      userId: firebaseUser.uid,
      spaceId: 'starter-app', // TODO: Replace with your app's space ID
      handler: StarterAppNotificationHandler(),
    );
  } else {
    WorkernNotificationService.unregisterFCMToken(
      userId: firebaseUser?.uid ?? 'unknown',
      spaceId: 'starter-app', // TODO: Replace with your app's space ID
    );
  }
});

/// Keeps RevenueCat in sync with the Firebase auth state.
/// - Sign-in  → logIn(uid)  so purchases are tied to the Firebase user.
/// - Sign-out → logOut()    so purchases are not shared between users.
final billingAuthSyncProvider = Provider.autoDispose<void>((ref) {
  final firebaseUser = ref.watch(firebaseUserProvider);
  if (firebaseUser != null) {
    WorkernBilling.logIn(firebaseUser.uid);
  } else {
    WorkernBilling.logOut();
  }
});

class StarterApp extends ConsumerWidget {
  const StarterApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => _buildApp(ref);

  Widget _buildApp(WidgetRef ref) {
    // Watch notification service provider - auto-initializes on user sign-in
    ref.watch(notificationServiceProvider);
    // Sync RevenueCat with Firebase user (logIn / logOut)
    ref.watch(billingAuthSyncProvider);

    // Listen for content shared from other apps via the Share sheet.
    // Stores each incoming SharedFile in [workernPendingSharedMediaProvider].
    // TODO: Read workernPendingSharedMediaProvider in your app's navigation/home
    //       screen and present a sheet/dialog to handle the shared content.
    ref.listen(workernSharedMediaStreamProvider, (_, next) {
      next.whenData((file) {
        ref.read(workernPendingSharedMediaProvider.notifier).set(file);
      });
    });

    return ShadApp.custom(
      themeMode: ThemeMode.system,
      theme: ShadThemeData(
        brightness: Brightness.light,
        colorScheme: const ShadSlateColorScheme.light(),
      ),
      darkTheme: ShadThemeData(
        brightness: Brightness.dark,
        colorScheme: const ShadSlateColorScheme.dark(),
      ),
      appBuilder: (context) {
        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'Starter App',
          theme: appTheme,
          darkTheme: appDarkTheme,
          routerConfig: ref.watch(routerProvider),
          builder: (context, child) => ShadAppBuilder(child: child!),
        );
      },
    );
  }
}
