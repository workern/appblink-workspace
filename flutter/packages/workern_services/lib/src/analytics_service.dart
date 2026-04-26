import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

/// Thin wrapper around [FirebaseAnalytics] for use across all Workern apps.
///
/// Usage:
/// ```dart
/// AnalyticsService.logEvent('order_placed', parameters: {'order_id': id});
/// AnalyticsService.logScreenView('HomeScreen');
/// AnalyticsService.setUserId(userId);
/// ```
class AnalyticsService {
  AnalyticsService._();

  static FirebaseAnalytics get _analytics => FirebaseAnalytics.instance;

  /// Log a custom event.
  ///
  /// [name] must not be empty and must follow Firebase naming conventions
  /// (alphanumeric + underscores, max 40 chars, must not start with a digit).
  static Future<void> logEvent(
    String name, {
    Map<String, Object>? parameters,
  }) async {
    try {
      await _analytics.logEvent(name: name, parameters: parameters);
      if (kDebugMode) {
        debugPrint('📊 Analytics event: $name | params: $parameters');
      }
    } catch (e) {
      debugPrint('⚠️ Analytics logEvent failed ($name): $e');
    }
  }

  /// Log a screen view.
  static Future<void> logScreenView(
    String screenName, {
    String? screenClass,
  }) async {
    try {
      await _analytics.logScreenView(
        screenName: screenName,
        screenClass: screenClass,
      );
      if (kDebugMode) {
        debugPrint('📊 Analytics screen: $screenName');
      }
    } catch (e) {
      debugPrint('⚠️ Analytics logScreenView failed ($screenName): $e');
    }
  }

  /// Associate subsequent events with [userId]. Pass `null` to clear.
  static Future<void> setUserId(String? userId) async {
    try {
      await _analytics.setUserId(id: userId);
    } catch (e) {
      debugPrint('⚠️ Analytics setUserId failed: $e');
    }
  }

  /// Set a user property.
  static Future<void> setUserProperty({
    required String name,
    required String? value,
  }) async {
    try {
      await _analytics.setUserProperty(name: name, value: value);
    } catch (e) {
      debugPrint('⚠️ Analytics setUserProperty failed ($name): $e');
    }
  }

  /// Returns an [FirebaseAnalyticsObserver] to wire into [GoRouter] or
  /// [Navigator] for automatic screen tracking.
  static FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: _analytics);
}
