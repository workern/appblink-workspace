import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../services/auth_service.dart';
import '../models/user_model.dart';

// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) => AuthService());

// Auth state stream provider
final authStateStreamProvider = StreamProvider<firebase_auth.User?>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

// Current Firebase user provider
final firebaseUserProvider = Provider<firebase_auth.User?>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  return authState.value;
});

// App user provider (loads user data from Firestore)
final appUserProvider = FutureProvider<User?>((ref) async {
  final firebaseUser = ref.watch(firebaseUserProvider);
  if (firebaseUser == null) return null;

  final authService = ref.watch(authServiceProvider);

  try {
    debugPrint('🔄 Loading user data for: ${firebaseUser.uid}');
    User? appUser = await authService.getUserData(firebaseUser.uid);

    // Retry with progressive delays if user data doesn't exist yet
    if (appUser == null) {
      debugPrint('⏳ User data not found, retrying with delays...');

      for (int i = 0; i < 3 && appUser == null; i++) {
        await Future.delayed(Duration(seconds: 1 + i));
        appUser = await authService.getUserData(firebaseUser.uid);
      }

      // If still null, create a temporary user from Firebase Auth data
      if (appUser == null) {
        debugPrint(
          '⚠️ User profile not yet available, using Firebase Auth data as fallback',
        );
        appUser = User(
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          name: firebaseUser.displayName ?? 'User',
          photoURL: firebaseUser.photoURL,
          addresses: const [],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
      }
    }

    return appUser;
  } catch (e) {
    debugPrint('❌ Error loading user data: $e');
    return null;
  }
});

// Is authenticated provider
final isAuthenticatedProvider = Provider<bool>((ref) {
  final firebaseUser = ref.watch(firebaseUserProvider);
  return firebaseUser != null;
});

// Loading state provider
final authLoadingProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  return authState.isLoading;
});

// Sign out function
Future<void> signOut(WidgetRef ref) async {
  try {
    final authService = ref.read(authServiceProvider);
    await authService.signOut();
    debugPrint('🚪 User signed out');
  } catch (e) {
    debugPrint('❌ Error signing out: $e');
    rethrow;
  }
}

// Update user profile function
Future<bool> updateUserProfile(WidgetRef ref, String userId, User user) async {
  try {
    final authService = ref.read(authServiceProvider);
    await authService.updateUserProfile(userId, user);
    ref.invalidate(appUserProvider);
    return true;
  } catch (e) {
    debugPrint('❌ Error updating user profile: $e');
    return false;
  }
}

/// Legacy ChangeNotifier provider for backward compatibility
/// Deprecated: Use the Riverpod providers above instead
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  firebase_auth.User? _firebaseUser;
  User? _appUser;
  bool _isLoading = true;
  String? _errorMessage;
  StreamSubscription<firebase_auth.User?>? _authSubscription;

  // Getters
  firebase_auth.User? get firebaseUser => _firebaseUser;
  User? get appUser => _appUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _firebaseUser != null;
  bool get isAnonymous => _firebaseUser?.isAnonymous ?? false;

  AuthProvider() {
    // Check if user is already signed in on boot
    _firebaseUser = _authService.currentUser;
    if (_firebaseUser != null) {
      debugPrint('🔐 User already signed in on boot: ${_firebaseUser!.uid} (isAnonymous: ${_firebaseUser!.isAnonymous})');
      _loadUserData(_firebaseUser!.uid);
      _isLoading = false;
    } else {
      debugPrint('🚪 No cached user on boot, showing unauthenticated state');
      _isLoading = false;
    }

    // Listen to auth state changes for sign-ins/upgrades
    _authSubscription = _authService.authStateChanges.listen((
      firebase_auth.User? user,
    ) async {
      debugPrint('🔄 Auth state changed: ${user?.uid ?? "null"} (isAnonymous: ${user?.isAnonymous})');
      if (user != null) {
        _firebaseUser = user;
        _isLoading = false;
        debugPrint('🔐 User signed in/updated: ${user.uid}');
        notifyListeners(); // Notify immediately so the router can redirect
        await _loadUserData(user.uid); // Load profile data in background
      } else {
        // User signed out — clear state and notify listeners.
        // This can happen transiently when signInWithCredential replaces an
        // anonymous session (Firebase briefly emits null before the new user).
        // _signInAnonymously will be called by signOut() if needed;
        // here we just update state so the router can react.
        _firebaseUser = null;
        _appUser = null;
        _isLoading = false;
        notifyListeners();
      }
    });
  }

  Future<void> _signInAnonymously({bool showLoading = true}) async {
    try {
      if (showLoading) {
        _isLoading = true;
        _errorMessage = null;
        notifyListeners();
      }
      await _authService.signInAnonymously();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Failed to establish guest session';
      notifyListeners();
    }
  }

  /// Loads user data from Firestore
  /// Retries with delays if profile doesn't exist yet (backend creates it asynchronously)
  /// Falls back to Firebase Auth user data if Firestore profile is not available
  Future<void> _loadUserData(String userId) async {
    try {
      debugPrint('🔄 Loading user data for: $userId');
      _appUser = await _authService.getUserData(userId);

      // Retry with progressive delays if user data doesn't exist yet
      // Backend creates profile asynchronously after user signs up
      if (_appUser == null) {
        debugPrint('⏳ User data not found, retrying with delays...');

        // Try 3 times with increasing delays
        for (int i = 0; i < 3 && _appUser == null; i++) {
          await Future.delayed(Duration(seconds: 1 + i));
          _appUser = await _authService.getUserData(userId);
        }

        // If still null, create a temporary user from Firebase Auth data
        if (_appUser == null && _firebaseUser != null) {
          debugPrint(
            '⚠️ User profile not yet available, using Firebase Auth data as fallback',
          );
          _appUser = User(
            uid: _firebaseUser!.uid,
            email: _firebaseUser!.email ?? '',
            name: _firebaseUser!.displayName ?? 'User',
            photoURL: _firebaseUser!.photoURL,
            addresses: const [],
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
        }
      }

      notifyListeners();
    } catch (e) {
      debugPrint('❌ Error loading user data: $e');
      _errorMessage = 'Failed to load user data';
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  /// Reloads the current user state from Firebase and notifies listeners
  Future<void> reloadUser() async {
    _firebaseUser = _authService.currentUser;
    debugPrint('🔄 Manually reloaded user: ${_firebaseUser?.uid} (isAnonymous: ${_firebaseUser?.isAnonymous})');
    if (_firebaseUser != null) {
      await _loadUserData(_firebaseUser!.uid);
    }
    _isLoading = false;
    notifyListeners();
  }

  /// Signs out the current user
  Future<void> signOut() async {
    try {
      _errorMessage = null;
      await _authService.signOut();

      _firebaseUser = null;
      _appUser = null;
      _isLoading = false;
      notifyListeners();
      debugPrint('🚪 Explicit sign out completed');
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Updates user profile
  Future<bool> updateUserProfile(User user) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _authService.updateUserProfile(_firebaseUser!.uid, user);
      _appUser = user;

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Clears error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
