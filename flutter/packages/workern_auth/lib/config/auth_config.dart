import 'package:firebase_ui_auth/firebase_ui_auth.dart';
import 'package:firebase_ui_oauth_google/firebase_ui_oauth_google.dart';
import 'package:firebase_ui_oauth_apple/firebase_ui_oauth_apple.dart';

/// Configures Firebase UI Auth providers globally
///
/// This should be called once in the app's main() function
/// before running the app.
void configureFirebaseAuthProviders({required String googleClientId}) {
  final List<AuthProvider> providers = [
    PhoneAuthProvider(),
    EmailAuthProvider(),
    AppleProvider(),
  ];

  // Add Google provider if clientId is provided
  if (googleClientId.isNotEmpty) {
    providers.add(GoogleProvider(clientId: googleClientId));
  }

  FirebaseUIAuth.configureProviders(providers);
}
