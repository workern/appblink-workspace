import 'package:flutter/foundation.dart';

/// Patches localhost URLs to the configured emulator host for local development.
/// This prevents Connection Refused errors in Android emulators/real devices.
String patchEmulatorUrl(String url) {
  if (url.isEmpty) return url;
  if (kDebugMode && url.contains('localhost')) {
    const emulatorHost = String.fromEnvironment('EMULATOR_HOST', defaultValue: 'localhost');
    if (emulatorHost != 'localhost') {
      return url.replaceAll('localhost', emulatorHost);
    }
  }
  return url;
}
