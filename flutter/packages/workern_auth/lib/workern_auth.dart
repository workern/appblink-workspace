/// Workern Auth Package
///
/// A reusable authentication package for Workern Flutter applications.
/// Provides global Firebase authentication configuration, services, providers, models,
/// and screens for handling user authentication with multiple auth methods.
///
/// Usage:
/// 1. Call [configureFirebaseAuthProviders] in main() before running the app
/// 2. Use [LoginScreen] for the login UI
/// 3. Other auth flows are handled by firebase_ui_auth

library workern_auth;

import 'package:workern_auth/screens/login_screen.dart' show LoginScreen;
import 'package:workern_auth/workern_auth.dart' show LoginScreen;

// Configuration
export 'config/auth_config.dart';

// Models
export 'models/user_model.dart';

// Services
export 'services/auth_service.dart';

// Providers
export 'providers/auth_provider.dart';

// Screens
export 'screens/login_screen.dart';
export 'screens/otp_verification_screen.dart';
export 'screens/account_profile_screen.dart';

// Widgets
export 'widgets/auth_snackbar.dart';
