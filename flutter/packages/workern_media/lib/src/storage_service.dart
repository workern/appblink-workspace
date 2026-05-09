import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:workern_services/workern_services.dart';

/// Service for handling Firebase Storage operations
class StorageService {
  final FirebaseStorage _storage;
  final FirebaseUsageTracker _tracker = FirebaseUsageTracker.instance;

  StorageService({FirebaseStorage? storage})
    : _storage = storage ?? FirebaseStorage.instance;

  /// Get download URL from Firebase Storage path
  ///
  /// Supports both formats:
  /// - gs://bucket-name/path/to/file.jpg
  /// - path/to/file.jpg (without gs:// prefix)
  ///
  /// Returns the original path if conversion fails
  Future<String> getDownloadUrl(String storagePath) async {
    try {
      debugPrint('🔥 StorageService: Getting download URL for: $storagePath');
      String path = storagePath;

      // Handle gs:// format
      if (storagePath.startsWith('gs://')) {
        final uri = Uri.parse(storagePath);
        // Remove leading '/' from path
        path = uri.path.substring(1);
        debugPrint(
          '🔥 StorageService: Extracted path from gs:// format: $path',
        );
      } else {
        debugPrint('🔥 StorageService: Using path as-is (no gs:// prefix)');
      }

      // Get download URL from Firebase Storage
      debugPrint(
        '🔥 StorageService: Calling Firebase Storage ref().getDownloadURL()...',
      );
      final downloadUrl = await _storage.ref(path).getDownloadURL();
      _tracker.recordStorageDownload(count: 1);
      debugPrint('✅ StorageService: Successfully got download URL');
      debugPrint('   - Original: $storagePath');
      debugPrint('   - Download URL: $downloadUrl');
      return downloadUrl;
    } catch (e, stackTrace) {
      debugPrint(
        '❌ StorageService: Failed to get download URL for $storagePath',
      );
      debugPrint('   - Error: $e');
      debugPrint('   - StackTrace: $stackTrace');
      // Return original path as fallback
      return storagePath;
    }
  }

  /// Get download URL from Firebase Storage path, with null handling
  ///
  /// Returns null if storagePath is null or if conversion fails and fallback is null
  Future<String?> getDownloadUrlOrNull(
    String? storagePath, {
    String? fallbackUrl,
  }) async {
    if (storagePath == null) {
      debugPrint(
        '🔥 StorageService: storagePath is null, returning fallback: $fallbackUrl',
      );
      return fallbackUrl;
    }

    try {
      return await getDownloadUrl(storagePath);
    } catch (e) {
      debugPrint(
        '❌ StorageService: getDownloadUrl threw exception, using fallback: $fallbackUrl',
      );
      debugPrint('   - Error: $e');
      debugPrint('Failed to get download URL, using fallback: $e');
      return fallbackUrl;
    }
  }

  /// Check if a path is a Firebase Storage path (starts with gs://)
  bool isStoragePath(String path) {
    return path.startsWith('gs://');
  }

  /// Upload file to Firebase Storage
  /// Returns the download URL of the uploaded file
  Future<String> uploadFile({
    required String path,
    required Uint8List data,
    String? contentType,
  }) async {
    final ref = _storage.ref(path);
    final metadata = contentType != null
        ? SettableMetadata(contentType: contentType)
        : null;

    await ref.putData(data, metadata);
    _tracker.recordStorageUpload(count: 1, bytes: data.length);
    final url = await ref.getDownloadURL();
    _tracker.recordStorageDownload(count: 1);
    return url;
  }

  /// Delete file from Firebase Storage
  Future<void> deleteFile(String path) async {
    try {
      String storagePath = path;

      // Handle gs:// format
      if (path.startsWith('gs://')) {
        final uri = Uri.parse(path);
        storagePath = uri.path.substring(1);
      }

      await _storage.ref(storagePath).delete();
      _tracker.recordStorageDelete(count: 1);
    } catch (e) {
      debugPrint('Failed to delete file at $path: $e');
      rethrow;
    }
  }
}
