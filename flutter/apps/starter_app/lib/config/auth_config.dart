// Authentication configuration for Starter App app
// Provides OAuth client IDs and other auth-related configuration

import 'package:flutter/foundation.dart';

/// Returns the appropriate Google Client ID based on the platform
String get GOOGLE_CLIENT_ID {
  if (defaultTargetPlatform == TargetPlatform.iOS) {
    // iOS Google Client ID from Firebase Console
    return '';
  } else if (defaultTargetPlatform == TargetPlatform.android) {
    // Android Google Client ID from Firebase Console
    return '524580981259-9p2hoevas5oevqa8jvof025vpjbn12bp.apps.googleusercontent.com';
  } else if (kIsWeb) {
    // Web Google Client ID from Firebase Console
    return '524580981259-REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';
  } else {
    // Default fallback
    return '524580981259-REPLACE_WITH_DEFAULT_CLIENT_ID.apps.googleusercontent.com';
  }
}

// TODO: Replace the placeholder client IDs above with actual values from:
// Firebase Console > Project Settings > General > Your apps > Web App
// Look for "Web client ID" under OAuth 2.0 Client IDs
