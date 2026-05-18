import '../common/base.dart';

enum MediaType { photo, video }

class MediaItem extends Base {
  final MediaType mediaType;
  final String uri;
  final String? thumbnailUrl;
  final int? width;
  final int? height;
  final int? duration; // in seconds, for videos

  MediaItem({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required this.mediaType,
    required this.uri,
    this.thumbnailUrl,
    this.width,
    this.height,
    this.duration,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) => MediaItem(
    id: json['id'],
    mediaType: MediaType.values.firstWhere((e) => e.name == json['mediaType']),
    uri: json['uri'],
    thumbnailUrl: json['thumbnailUrl'],
    width: json['width'],
    height: json['height'],
    duration: json['duration'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'mediaType': mediaType.name,
    'uri': uri,
    'thumbnailUrl': thumbnailUrl,
    'width': width,
    'height': height,
    'duration': duration,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
