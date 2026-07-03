import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';

/// Service class for handling authentication operations with Firebase
/// Sign in/up flows are handled by firebase_ui_auth
class AuthService {
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  firebase_auth.User? get currentUser => _auth.currentUser;
  Stream<firebase_auth.User?> get authStateChanges => _auth.userChanges();

  /// Fetches user data from Firestore
  Future<User?> getUserData(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return User.fromJson(doc.data() ?? {});
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching user data: $e');
      return null;
    }
  }

  /// Updates user profile in Firestore
  Future<void> updateUserProfile(String userId, User user) async {
    try {
      await _firestore.collection('users').doc(userId).update(user.toJson());

      debugPrint('✅ User profile updated for: $userId');
    } catch (e) {
      debugPrint('❌ Error updating user profile: $e');
      throw 'Error updating user profile: $e';
    }
  }

  /// Signs out the current user
  Future<void> signOut() async {
    try {
      await _auth.signOut();
      debugPrint('✅ User signed out');
    } catch (e) {
      debugPrint('❌ Error signing out: $e');
      throw 'Error signing out: $e';
    }
  }

  /// Gets current user data for database logs (uid, email, name, mobile)
  /// Returns null if no user is signed in or user data not found
  Map<String, dynamic>? getCurrentUserForDbLogs() {
    try {
      final user = currentUser;
      if (user == null) return null;

      // Fallback to Firebase Auth data if Firestore data not available
      return {
        'uid': user.uid,
        if (user.email != null) 'email': user.email,
        if (user.displayName != null) 'name': user.displayName,
        if (user.phoneNumber != null) 'mobile': user.phoneNumber,
      };
    } catch (e) {
      debugPrint('❌ Error getting current user for db logs: $e');
      return null;
    }
  }

  /// Signs in with email and password.
  Future<firebase_auth.UserCredential> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    return _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  /// Signs in anonymously as a guest.
  Future<firebase_auth.UserCredential> signInAnonymously() async {
    try {
      final credential = await _auth.signInAnonymously();
      debugPrint('✅ Signed in anonymously: ${credential.user?.uid}');
      return credential;
    } catch (e) {
      debugPrint('❌ Error signing in anonymously: $e');
      rethrow;
    }
  }

  /// Configures the Android debug reCAPTCHA flow.
  /// Call this only in debug mode when Play Integrity / SHA config is incomplete.
  Future<void> configureAndroidDebugRecaptcha() async {
    await _auth.setSettings(forceRecaptchaFlow: true);
    debugPrint('✅ Android phone auth configured with debug reCAPTCHA fallback');
  }
}
