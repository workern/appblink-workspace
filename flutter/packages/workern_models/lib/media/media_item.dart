import 'package:workern_utils/workern_utils.dart';

class MediaItem {
  final String id;
  final MediaType type;
  final String url; // Original URL or Firebase Storage URL
  final String? thumbnailUrl;
  final int? width;
  final int? height;
  final double? duration; // For videos (in seconds)
  final String? storedAt; // Firebase Storage path if downloaded
  final DateTime? expiringAt; // For ephemeral content

  MediaItem({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.width,
    this.height,
    this.duration,
    this.storedAt,
    this.expiringAt,
  });

  bool get isStored => storedAt != null;
  bool get isExpired =>
      expiringAt != null && DateTime.now().isAfter(expiringAt!);

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      id: json['id'] as String,
      type: MediaType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => MediaType.photo,
      ),
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      duration: (json['duration'] as num?)?.toDouble(),
      storedAt: json['storedAt'] as String?,
      expiringAt: parseTimestamp(json['expiringAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'url': url,
      'thumbnailUrl': thumbnailUrl,
      'width': width,
      'height': height,
      'duration': duration,
      'storedAt': storedAt,
      'expiringAt': expiringAt?.millisecondsSinceEpoch,
    };
  }
}

enum MediaType { photo, video }
