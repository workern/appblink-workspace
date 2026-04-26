import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'cloud_functions_service.dart';
import 'media_upload_service.dart';
import 'storage_service.dart';

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

/// Provider for MediaUploadService singleton instance
///
/// This provider ensures a single instance of MediaUploadService
/// is shared across the entire app. Use this provider to upload
/// images and videos to Firebase Storage with compression.
///
/// Example:
/// ```dart
/// final mediaService = ref.read(mediaUploadServiceProvider);
/// final result = await mediaService.uploadMedia(
///   file: File('path/to/file'),
///   storagePath: 'users/userId/media',
/// );
/// ```
final mediaUploadServiceProvider = Provider<MediaUploadService>((ref) {
  return MediaUploadService();
});

/// Provider for StorageService singleton instance
///
/// This provider ensures a single instance of StorageService
/// is shared across the entire app. Use this provider to interact
/// with Firebase Storage, including getting download URLs from
/// storage paths.
///
/// Example:
/// ```dart
/// final storageService = ref.read(storageServiceProvider);
/// final url = await storageService.getDownloadUrl('gs://bucket/path/file.jpg');
/// ```
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});
