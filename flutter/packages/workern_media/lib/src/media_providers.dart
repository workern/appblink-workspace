import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'media_upload_service.dart';
import 'storage_service.dart';

/// Provider for MediaUploadService singleton instance
final mediaUploadServiceProvider = Provider<MediaUploadService>((ref) {
  return MediaUploadService();
});

/// Provider for StorageService singleton instance
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});
