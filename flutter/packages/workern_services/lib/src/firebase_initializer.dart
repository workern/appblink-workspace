import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:workern_auth/workern_auth.dart';
import 'cloud_functions_service.dart';

/// Configuration for Firebase initialization
class FirebaseInitConfig {
  /// Firebase options (platform-specific)
  final FirebaseOptions firebaseOptions;

  /// Google OAuth client ID (for configuring Google Sign-In)
  final String? googleClientId;

  /// Emulator host (only used in debug mode)
  /// Use 'localhost' for iOS Simulator/Android Emulator
  /// Use '192.168.x.x' for physical devices on same network
  final String emulatorHost;

  /// Emulator port for Auth service
  final int authEmulatorPort;

  /// Emulator port for Firestore service
  final int firestoreEmulatorPort;

  /// Emulator port for Storage service
  final int storageEmulatorPort;

  /// Emulator port for Functions service
  final int functionsEmulatorPort;

  /// Background message handler for Firebase Messaging
  final Future<void> Function(RemoteMessage)? backgroundMessageHandler;

  /// Whether to use Firebase emulators
  /// If null, defaults to true in debug mode and false in release mode
  final bool? useEmulators;

  /// Cloud Function names to warm up immediately after initialization.
  /// Fires-and-forgets unauthenticated calls so containers are warm before
  /// the user interacts with the app. Only runs in production (not emulators).
  final List<String> warmupFunctions;

  /// Whether to force reCAPTCHA verification for Android phone auth.
  /// Set to true when running debug builds on physical devices that don't
  /// have their SHA-1 fingerprint registered in Firebase Console.
  /// This bypasses Play Integrity / SmsRetriever and uses the reCAPTCHA
  /// WebView instead, which works without SHA fingerprints.
  /// Has no effect on iOS or on builds with a registered SHA fingerprint.
  final bool forceAndroidRecaptcha;

  const FirebaseInitConfig({
    required this.firebaseOptions,
    this.googleClientId,
    this.emulatorHost = const String.fromEnvironment('EMULATOR_HOST', defaultValue: 'localhost'),
    this.authEmulatorPort = 9100,
    this.firestoreEmulatorPort = 8081,
    this.storageEmulatorPort = 9199,
    this.functionsEmulatorPort = 5001,
    this.backgroundMessageHandler,
    this.useEmulators,
    this.warmupFunctions = const [],
    this.forceAndroidRecaptcha = false,
  });
}

/// Centralized Firebase initialization service for all Workern apps
class FirebaseInitializer {
  static bool _isFunctionsEmulatorConfigured = false;
  static String _functionsTargetDescription = 'Production (asia-south2)';

  static bool get isFunctionsEmulatorConfigured =>
      _isFunctionsEmulatorConfigured;

  static String get functionsTargetDescription => _functionsTargetDescription;

  /// Initialize Firebase with all required services
  static Future<void> initialize(FirebaseInitConfig config) async {
    try {
      debugPrint('🚀 Starting Firebase initialization');
      _isFunctionsEmulatorConfigured = false;
      _functionsTargetDescription = 'Production (asia-south2)';

      // Initialize Firebase Core only if not already initialized
      try {
        if (Firebase.apps.isEmpty) {
          await Firebase.initializeApp(options: config.firebaseOptions);
          debugPrint('✅ Firebase Core initialized');
        } else {
          debugPrint('⚠️ Firebase Core already initialized');
        }
      } catch (e) {
        if (e is FirebaseException && e.code == 'duplicate-app') {
          debugPrint('⚠️ Firebase Core already initialized (duplicate-app caught)');
        } else if (e.toString().contains('duplicate-app')) {
          debugPrint('⚠️ Firebase Core already initialized (duplicate-app string match)');
        } else {
          rethrow;
        }
      }

      // Initialize Firebase App Check
        await _initializeAppCheck();

      // If the debug build's SHA fingerprint isn't registered in Firebase
      // Console, Play Integrity and SmsRetriever will fail and the automatic
      // reCAPTCHA fallback gets silently canceled by the system (17093 error).
      // Forcing reCAPTCHA mode skips Play Integrity entirely and opens the
      // reCAPTCHA WebView directly — this works without SHA fingerprints.
      if (config.forceAndroidRecaptcha) {
        try {
          await FirebaseAuth.instance.setSettings(forceRecaptchaFlow: true);
          debugPrint('✅ Android phone auth: forced reCAPTCHA mode (no Play Integrity)');
        } catch (e) {
          debugPrint('⚠️ Could not set reCAPTCHA mode: $e');
        }
      }

      // Initialize Remote Config with defaults
      await _initializeRemoteConfig();

      // Connect to emulators based on config (must happen AFTER Firebase is initialized)
      // In release mode: never use emulators, regardless of config
      // In debug mode: respect config.useEmulators (default to true)
      final shouldUseEmulators = kDebugMode && (config.useEmulators ?? true);
      if (shouldUseEmulators) {
        await _connectToEmulators(config);
      }

      // Set up background message handler if provided
      if (config.backgroundMessageHandler != null) {
        FirebaseMessaging.onBackgroundMessage(config.backgroundMessageHandler!);
        debugPrint('✅ Background message handler set');
      }

      // Configure Firebase UI Auth providers
      configureFirebaseAuthProviders(
        googleClientId: config.googleClientId ?? '',
      );

      // Warm up Cloud Functions (production only — skip when using emulators)
      if (!shouldUseEmulators && config.warmupFunctions.isNotEmpty) {
        _warmUpFunctions(config.warmupFunctions);
      }

      debugPrint('✅ Firebase initialization complete');
    } catch (e) {
      debugPrint('❌ Firebase initialization error: $e');

      // Even if initialization fails, still try to connect to emulators if configured
      // This handles the case where Firebase is pre-initialized
      // In release mode: never use emulators, regardless of config
      final shouldUseEmulatorsOnError =
          kDebugMode && (config.useEmulators ?? true);
      if (shouldUseEmulatorsOnError) {
        try {
          debugPrint(
            '🔧 Attempting emulator connection after initialization error',
          );
          await _connectToEmulators(config);
        } catch (emuError) {
          debugPrint('⚠️ Emulator connection failed: $emuError');
        }
      }

      rethrow;
    }
  }

  /// Initialize Firebase App Check
  static Future<void> _initializeAppCheck() async {
    try {
      await FirebaseAppCheck.instance.activate(
        providerAndroid: kDebugMode
            ? const AndroidDebugProvider()
            : const AndroidPlayIntegrityProvider(),
        providerApple: kDebugMode
            ? const AppleDebugProvider()
            : const AppleDeviceCheckProvider(),
      );
      debugPrint('✅ Firebase App Check initialized');
    } catch (e) {
      debugPrint('⚠️ Firebase App Check initialization warning: $e');
      // Don't rethrow - App Check is not critical for functionality
    }
  }

  /// Initialize Firebase Remote Config with default values
  static Future<void> _initializeRemoteConfig() async {
    try {
      final remoteConfig = FirebaseRemoteConfig.instance;

      // Set config settings
      await remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(seconds: 10),
          minimumFetchInterval: kDebugMode
              ? const Duration(seconds: 10) // Fast refresh in debug
              : const Duration(hours: 1), // 1 hour in production
        ),
      );

      // Set default values
      await remoteConfig.setDefaults(<String, dynamic>{
        'free_saves_limit': 100, // Default free saves before paywall
      });

      // Fetch and activate (non-blocking)
      await remoteConfig.fetchAndActivate();

      debugPrint('✅ Firebase Remote Config initialized');
      debugPrint(
        '   free_saves_limit: ${remoteConfig.getInt('free_saves_limit')}',
      );
    } catch (e) {
      debugPrint('⚠️ Firebase Remote Config initialization warning: $e');
      // Don't rethrow - Remote Config is not critical, defaults will be used
    }
  }

  /// Fires-and-forgets warmup calls to pre-heat Cloud Function containers.
  /// Delegates to [CloudFunctionsService.firebaseRequest] which issues a plain
  /// HTTP GET — no auth token, no callable-protocol overhead.
  static void _warmUpFunctions(List<String> names) {
    for (final name in names) {
      CloudFunctionsService.firebaseRequest(name);
    }
    debugPrint(
      '🔥 Warming up ${names.length} Cloud Function(s): ${names.join(', ')}',
    );
  }

  /// Connect to Firebase emulators in debug mode
  static Future<void> _connectToEmulators(FirebaseInitConfig config) async {
    try {
      debugPrint(
        '🔧 Connecting to Firebase Emulators at ${config.emulatorHost}',
      );

      // Connect to Auth Emulator
      await FirebaseAuth.instance.useAuthEmulator(
        config.emulatorHost,
        config.authEmulatorPort,
      );
      debugPrint(
        '✅ Auth Emulator connected: ${config.emulatorHost}:${config.authEmulatorPort}',
      );

      // Enable phone auth test mode for emulator (bypasses SMS)
      await FirebaseAuth.instance.setSettings(
        appVerificationDisabledForTesting: true,
      );
      debugPrint('✅ Phone auth test mode enabled');

      // Connect to Firestore Emulator
      FirebaseFirestore.instance.useFirestoreEmulator(
        config.emulatorHost,
        config.firestoreEmulatorPort,
      );
      debugPrint(
        '✅ Firestore Emulator connected: ${config.emulatorHost}:${config.firestoreEmulatorPort}',
      );

      // Connect to Storage Emulator
      await FirebaseStorage.instance.useStorageEmulator(
        config.emulatorHost,
        config.storageEmulatorPort,
      );
      debugPrint(
        '✅ Storage Emulator connected: ${config.emulatorHost}:${config.storageEmulatorPort}',
      );

      // Connect to Functions Emulator
      FirebaseFunctions.instanceFor(
        region: 'asia-south2',
      ).useFunctionsEmulator(config.emulatorHost, config.functionsEmulatorPort);
      _isFunctionsEmulatorConfigured = true;
      _functionsTargetDescription =
          'Emulator ${config.emulatorHost}:${config.functionsEmulatorPort} (asia-south2)';

      debugPrint(
        '✅ Functions Emulator connected (asia-south2): ${config.emulatorHost}:${config.functionsEmulatorPort}',
      );
    } catch (e) {
      _isFunctionsEmulatorConfigured = false;
      _functionsTargetDescription = 'Production (asia-south2)';
      debugPrint('⚠️ Emulator connection warning: $e');
      // Don't rethrow - emulators are optional for development
    }
  }
}
