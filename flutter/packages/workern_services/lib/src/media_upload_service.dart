import 'dart:io';
import 'dart:typed_data';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:video_compress/video_compress.dart';
import 'package:path/path.dart' as path;
import 'package:flutter/material.dart';
import 'package:workern_models/media/media_item.dart';
import 'firebase_usage_tracker.dart';

class MediaUploadResult {
  final String storagePath;
  final String downloadUrl;
  final String? thumbnailUrl;
  final MediaType mediaType;
  final int? width;
  final int? height;
  final int? duration; // in seconds for videos

  MediaUploadResult({
    required this.storagePath,
    required this.downloadUrl,
    this.thumbnailUrl,
    required this.mediaType,
    this.width,
    this.height,
    this.duration,
  });
}

class MediaUploadService {
  final FirebaseStorage _storage;
  final FirebaseUsageTracker _tracker = FirebaseUsageTracker.instance;

  MediaUploadService({FirebaseStorage? storage})
      : _storage = storage ?? FirebaseStorage.instance;

  /// Uploads an image or video to Firebase Storage with compression
  ///
  /// [file] - The media file to upload
  /// [storagePath] - The path in Firebase Storage (e.g., 'users/{userId}/media')
  /// [imageQuality] - Quality for image compression (0-100, default 85)
  /// [generateThumbnail] - Whether to generate thumbnail for videos (default true)
  Future<MediaUploadResult> uploadMedia({
    required File file,
    required String storagePath,
    int imageQuality = 85,
    bool generateThumbnail = true,
  }) async {
    final extension = path.extension(file.path).toLowerCase();
    final isVideo =
        ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv'].contains(extension);
    final isImage =
        ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].contains(extension);

    if (!isVideo && !isImage) {
      throw Exception('Unsupported file type: $extension');
    }

    if (isImage) {
      return _uploadImage(
        file: file,
        storagePath: storagePath,
        quality: imageQuality,
      );
    } else {
      return _uploadVideo(
        file: file,
        storagePath: storagePath,
        generateThumbnail: generateThumbnail,
      );
    }
  }

  Future<MediaUploadResult> _uploadImage({
    required File file,
    required String storagePath,
    required int quality,
  }) async {
    try {
      // Compress image
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        file.absolute.path,
        quality: quality,
        minWidth: 1920,
        minHeight: 1920,
      );

      if (compressedBytes == null) {
        throw Exception('Failed to compress image');
      }

      // Generate unique filename
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'image_$timestamp${path.extension(file.path)}';
      final fullPath = '$storagePath/$fileName';

      // Upload to Firebase Storage
      final ref = _storage.ref().child(fullPath);
      final uploadTask = ref.putData(
        Uint8List.fromList(compressedBytes),
        SettableMetadata(contentType: 'image/jpeg'),
      );

      final snapshot = await uploadTask;
      _tracker.recordStorageUpload(count: 1, bytes: compressedBytes.length);
      final downloadUrl = await snapshot.ref.getDownloadURL();
      _tracker.recordStorageDownload(count: 1);

      // Get image dimensions
      final decodedImage = await decodeImageFromList(compressedBytes);

      debugPrint('✅ Image uploaded: $fullPath');

      return MediaUploadResult(
        storagePath: fullPath,
        downloadUrl: downloadUrl,
        thumbnailUrl: downloadUrl, // For images, thumbnail is the same
        mediaType: MediaType.photo,
        width: decodedImage.width,
        height: decodedImage.height,
      );
    } catch (e) {
      debugPrint('❌ Error uploading image: $e');
      rethrow;
    }
  }

  Future<MediaUploadResult> _uploadVideo({
    required File file,
    required String storagePath,
    required bool generateThumbnail,
  }) async {
    try {
      // Compress video
      debugPrint('🎬 Compressing video...');
      final mediaInfo = await VideoCompress.compressVideo(
        file.path,
        quality: VideoQuality.MediumQuality,
        deleteOrigin: false,
      );

      if (mediaInfo == null || mediaInfo.file == null) {
        throw Exception('Failed to compress video');
      }

      // Generate unique filename
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'video_$timestamp.mp4';
      final fullPath = '$storagePath/$fileName';

      // Upload compressed video
      debugPrint('📤 Uploading video...');
      final ref = _storage.ref().child(fullPath);
      final uploadTask = ref.putFile(
        mediaInfo.file!,
        SettableMetadata(contentType: 'video/mp4'),
      );

      final snapshot = await uploadTask;
      final uploadedBytes = await mediaInfo.file!.length();
      _tracker.recordStorageUpload(count: 1, bytes: uploadedBytes);
      final downloadUrl = await snapshot.ref.getDownloadURL();
      _tracker.recordStorageDownload(count: 1);

      String? thumbnailUrl;
      if (generateThumbnail) {
        thumbnailUrl = await _generateAndUploadThumbnail(
          videoFile: mediaInfo.file!,
          storagePath: storagePath,
          timestamp: timestamp,
        );
      }

      final duration = mediaInfo.duration?.toInt();

      debugPrint('✅ Video uploaded: $fullPath');

      return MediaUploadResult(
        storagePath: fullPath,
        downloadUrl: downloadUrl,
        thumbnailUrl: thumbnailUrl,
        mediaType: MediaType.video,
        width: mediaInfo.width?.toInt(),
        height: mediaInfo.height?.toInt(),
        duration: duration,
      );
    } catch (e) {
      debugPrint('❌ Error uploading video: $e');
      rethrow;
    } finally {
      // Clean up temporary files
      await VideoCompress.deleteAllCache();
    }
  }

  Future<String?> _generateAndUploadThumbnail({
    required File videoFile,
    required String storagePath,
    required int timestamp,
  }) async {
    try {
      debugPrint('🖼️ Generating thumbnail...');
      final thumbnailFile = await VideoCompress.getFileThumbnail(
        videoFile.path,
        quality: 75,
      );

      // Compress thumbnail
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        thumbnailFile.absolute.path,
        quality: 80,
        minWidth: 640,
        minHeight: 640,
      );

      if (compressedBytes == null) {
        throw Exception('Failed to compress thumbnail');
      }

      final thumbFileName = 'thumbnail_$timestamp.jpg';
      final thumbPath = '$storagePath/$thumbFileName';

      // Upload thumbnail
      final ref = _storage.ref().child(thumbPath);
      final uploadTask = ref.putData(
        Uint8List.fromList(compressedBytes),
        SettableMetadata(contentType: 'image/jpeg'),
      );

      final snapshot = await uploadTask;
      _tracker.recordStorageUpload(count: 1, bytes: compressedBytes.length);
      final thumbnailUrl = await snapshot.ref.getDownloadURL();
      _tracker.recordStorageDownload(count: 1);

      debugPrint('✅ Thumbnail uploaded: $thumbPath');

      return thumbnailUrl;
    } catch (e) {
      debugPrint('⚠️ Failed to generate thumbnail: $e');
      return null;
    }
  }

  /// Deletes a file from Firebase Storage
  Future<void> deleteMedia(String storagePath) async {
    try {
      await _storage.ref().child(storagePath).delete();
      _tracker.recordStorageDelete(count: 1);
      debugPrint('✅ Deleted media: $storagePath');
    } catch (e) {
      debugPrint('❌ Error deleting media: $e');
      rethrow;
    }
  }
}
