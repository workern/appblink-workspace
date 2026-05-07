import 'dart:async' show unawaited;
import 'dart:convert';
import 'dart:io' show HttpClient, HttpHeaders;
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_initializer.dart';
import 'firebase_usage_tracker.dart';

class CloudFunctionsService {
  static const String _region = 'asia-south2';

  final FirebaseUsageTracker _usageTracker = FirebaseUsageTracker.instance;

  FirebaseFunctions? _functionsInstance;

  FirebaseFunctions get _functions {
    if (_functionsInstance == null) {
      _functionsInstance = FirebaseFunctions.instanceFor(region: _region);
      debugPrint('🔌 CloudFunctionsService initialized for region: $_region');
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
    final stopwatch = Stopwatch()..start();
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

      if (!functionName.startsWith('applicationusage-')) {
        stopwatch.stop();
        final bytes = _usageTracker.estimateBytes(sanitizedData) +
            _usageTracker.estimateBytes(result.data);
        _usageTracker.recordFunctionCall(
          count: 1,
          bytes: bytes,
          functionName: functionName,
        );
        _usageTracker.recordFunctionExecution(
          executionMs: stopwatch.elapsedMilliseconds,
        );
      }

      debugPrint('✅ Function call successful');
      return result.data;
    } on FirebaseFunctionsException catch (e, stackTrace) {
      if (stopwatch.isRunning) {
        stopwatch.stop();
      }
      debugPrint('❌ FirebaseFunctionsException: ${e.code}');
      debugPrint('❌ Message: ${e.message}');
      debugPrint('❌ Details: ${e.details}');
      debugPrint('❌ Stack Trace:\n$stackTrace');

      // Re-throw quota/limit errors as-is so callers can handle them typed
      // (e.g. resource-exhausted → SaveLimitReachedException in saves_service)
      if (e.code == 'resource-exhausted') rethrow;

      throw _handleFunctionException(e);
    } catch (e, stackTrace) {
      if (stopwatch.isRunning) {
        stopwatch.stop();
      }
      debugPrint('❌ Unexpected error calling function: $e');
      debugPrint('❌ Stack Trace:\n$stackTrace');
      throw 'Error calling Cloud Function $functionName: $e';
    }
  }

  /// Calls an HTTP onRequest Cloud Function.
  ///
  /// This is useful for functions exposed at
  /// `https://{region}-{projectId}.cloudfunctions.net/{functionName}`.
  Future<dynamic> callRequest(
    String functionName, {
    String method = 'POST',
    dynamic data,
    String region = _region,
    String? projectId,
    bool includeAuthToken = true,
    Map<String, String>? headers,
  }) async {
    final stopwatch = Stopwatch()..start();
    final sanitizedData = _sanitizeData(data);
    final client = HttpClient();

    try {
      final resolvedProjectId = projectId ?? Firebase.app().options.projectId;
      if (resolvedProjectId.isEmpty) {
        throw 'Firebase projectId is not configured';
      }

      final methodUpper = method.toUpperCase();
      if (methodUpper != 'GET' && methodUpper != 'POST') {
        throw 'Unsupported HTTP method: $methodUpper';
      }

      var url = Uri.parse(
        'https://$region-$resolvedProjectId.cloudfunctions.net/$functionName',
      );

      if (methodUpper == 'GET' && sanitizedData is Map) {
        final query = <String, String>{};
        sanitizedData.forEach((key, value) {
          if (value == null) return;
          query[key.toString()] = value.toString();
        });
        url = url.replace(queryParameters: query.isEmpty ? null : query);
      }

      debugPrint('☁️ Calling request function: $functionName');
      debugPrint('📍 Region: $region');
      debugPrint('🔗 URL: $url');

      final request = methodUpper == 'GET'
          ? await client.getUrl(url)
          : await client.postUrl(url);

      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      if (includeAuthToken) {
        final firebaseUser = FirebaseAuth.instance.currentUser;
        if (firebaseUser == null) {
          throw 'Not authenticated';
        }
        final idToken = await firebaseUser.getIdToken();
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $idToken');
      }

      headers?.forEach((key, value) {
        request.headers.set(key, value);
      });

      if (methodUpper == 'POST' && sanitizedData != null) {
        request.write(jsonEncode(sanitizedData));
      }

      final response = await request.close();
      final responseBody = await utf8.decoder.bind(response).join();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw 'HTTP ${response.statusCode}: $responseBody';
      }

      dynamic decoded;
      if (responseBody.isEmpty) {
        decoded = null;
      } else {
        try {
          decoded = jsonDecode(responseBody);
        } catch (_) {
          decoded = responseBody;
        }
      }

      if (!functionName.startsWith('applicationusage-')) {
        stopwatch.stop();
        final bytes = _usageTracker.estimateBytes(sanitizedData) +
            _usageTracker.estimateBytes(decoded);
        _usageTracker.recordFunctionCall(
          count: 1,
          bytes: bytes,
          functionName: functionName,
        );
        _usageTracker.recordFunctionExecution(
          executionMs: stopwatch.elapsedMilliseconds,
        );
      }

      return decoded;
    } catch (e, stackTrace) {
      if (stopwatch.isRunning) {
        stopwatch.stop();
      }
      debugPrint('❌ Error calling request function $functionName: $e');
      debugPrint('❌ Stack Trace:\n$stackTrace');
      rethrow;
    } finally {
      client.close(force: true);
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
    unawaited(() async {
      try {
        final req = await client.getUrl(url);
        await req.close();
      } catch (_) {
      } finally {
        client.close(force: true);
      }
    }());
  }

  static void configureUsageTracking({required String appId}) {
    FirebaseUsageTracker.instance.configure(appId: appId);
  }
}
