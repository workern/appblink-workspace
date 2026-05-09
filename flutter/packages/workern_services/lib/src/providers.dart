import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'cloud_functions_service.dart';

/// Provider for CloudFunctionsService singleton instance
///
/// This provider ensures a single instance of CloudFunctionsService
/// is shared across the entire app. Use this provider to call
/// Firebase Cloud Functions.
///
/// Example:
/// ```dart
/// final cloudFunctions = ref.read(cloudFunctionsProvider);
/// await cloudFunctions.call('functionName', data);
/// ```
final cloudFunctionsProvider = Provider<CloudFunctionsService>((ref) {
  return CloudFunctionsService();
});
