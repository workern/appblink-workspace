import 'dart:io' show HttpClient, HttpClientRequest;
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_initializer.dart';

class CloudFunctionsService {
  static const String _region = 'asia-south2';

  FirebaseFunctions? _functionsInstance;

  FirebaseFunctions get _functions {
    if (_functionsInstance == null) {
      _functionsInstance = FirebaseFunctions.instanceFor(region: _region);
      debugPrint(
          '🔌 CloudFunctionsService initialized for region: $_region');
      debugPrint(
          '📍 Target: ${FirebaseInitializer.functionsTargetDescription}');
    }
    return _functionsInstance!;
  }

  /// Calls a Cloud Function with the given function name and data.
  ///
  /// Parameters:
  /// - functionName: Name of the Cloud Function to call
  /// - data: Data to send to the function
  ///
  /// Returns: The response data from the function
  Future<dynamic> call(String functionName, [dynamic data]) async {
    try {
      debugPrint('☁️ Calling Cloud Function: $functionName');
      debugPrint('📍 Region: asia-south2');
      debugPrint(
          '🔌 Target: ${FirebaseInitializer.functionsTargetDescription}');

      // Sanitize data to convert Timestamp objects to epoch milliseconds
      final sanitizedData = _sanitizeData(data);
      debugPrint('📤 Data: $sanitizedData');

      final HttpsCallable callable = _functions.httpsCallable(functionName);
      final HttpsCallableResult result = await callable.call(sanitizedData);

      debugPrint('✅ Function call successful');
      return result.data;
    } on FirebaseFunctionsException catch (e, stackTrace) {
      debugPrint('❌ FirebaseFunctionsException: ${e.code}');
      debugPrint('❌ Message: ${e.message}');
      debugPrint('❌ Details: ${e.details}');
      debugPrint('❌ Stack Trace:\n$stackTrace');

      // Re-throw quota/limit errors as-is so callers can handle them typed
      // (e.g. resource-exhausted → SaveLimitReachedException in saves_service)
      if (e.code == 'resource-exhausted') rethrow;

      throw _handleFunctionException(e);
    } catch (e, stackTrace) {
      debugPrint('❌ Unexpected error calling function: $e');
      debugPrint('❌ Stack Trace:\n$stackTrace');
      throw 'Error calling Cloud Function $functionName: $e';
    }
  }

  /// Recursively sanitizes data to convert Timestamp objects to epoch milliseconds
  dynamic _sanitizeData(dynamic data) {
    if (data == null) {
      return null;
    } else if (data is Timestamp) {
      // Convert Timestamp to epoch milliseconds
      return data.millisecondsSinceEpoch;
    } else if (data is DateTime) {
      // Convert DateTime to epoch milliseconds
      return data.millisecondsSinceEpoch;
    } else if (data is Map) {
      // Recursively sanitize map values
      return data.map((key, value) => MapEntry(key, _sanitizeData(value)));
    } else if (data is List) {
      // Recursively sanitize list items
      return data.map((item) => _sanitizeData(item)).toList();
    } else {
      return data;
    }
  }

  /// Calls a generic Cloud Function with custom error handling
  ///
  /// This is a flexible method for calling any Cloud Function
  Future<T> callGeneric<T>(
    String functionName,
    Map<String, dynamic> data,
    T Function(dynamic) converter,
  ) async {
    try {
      final result = await call(functionName, data);
      return converter(result);
    } catch (e) {
      debugPrint('❌ Error calling $functionName: $e');
      rethrow;
    }
  }

  String _handleFunctionException(FirebaseFunctionsException e) {
    switch (e.code) {
      case 'invalid-argument':
        return 'Invalid argument: ${e.message}';
      case 'not-found':
        return 'Resource not found: ${e.message}';
      case 'permission-denied':
        return 'Permission denied: ${e.message}';
      case 'internal':
        return 'Internal server error: ${e.message}';
      case 'unavailable':
        return 'Service unavailable: ${e.message}';
      case 'unauthenticated':
        return 'Please sign in to perform this action';
      default:
        return '${e.message}';
    }
  }

  /// Enable Cloud Functions emulator for local development
  /// Use: CloudFunctionsService().useEmulator('localhost', 5001);
  void useEmulator(String host, int port) {
    _functions.useFunctionsEmulator(host, port);
    debugPrint('🔌 Connected to Cloud Functions emulator at $host:$port');
  }

  /// Fires a plain HTTP GET to a Cloud Function URL without any auth or
  /// callable-protocol overhead. Useful for warming up cold-start containers.
  /// All errors are silently ignored — this is fire-and-forget.
  static void firebaseRequest(String functionName) {
    final projectId = Firebase.app().options.projectId;
    final url = Uri.parse(
      'https://$_region-$projectId.cloudfunctions.net/$functionName',
    );
    final client = HttpClient();
    client
        .getUrl(url)
        .then((HttpClientRequest req) => req.close())
        .catchError((_) {});
  }
}
