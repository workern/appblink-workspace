import '../common/base.dart';

enum MediaType { IMAGE, VIDEO }

class MediaItem extends Base {
  final MediaType type;
  final String uri;
  final String hash;
  final int size;
  final int? width;
  final int? height;
  final Map<String, dynamic>? metadata;

  MediaItem({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required this.type,
    required this.uri,
    required this.hash,
    required this.size,
    this.width,
    this.height,
    this.metadata,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) => MediaItem(
    id: json['id'],
    type: MediaType.values.firstWhere((e) => e.name == json['type']),
    uri: json['uri'],
    hash: json['hash'],
    size: json['size'],
    width: json['width'],
    height: json['height'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
    metadata: json['metadata'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'uri': uri,
    'hash': hash,
    'size': size,
    'width': width,
    'height': height,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'metadata': metadata,
  };
}
