import 'package:workern_utils/workern_utils.dart';

/// Notification data model for Workern apps (matches TypeScript WorkernNotification)
class WorkernNotification {
  final String id;
  final String title;
  final String description;
  final String type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool seen;
  final String? imageUrl;
  final Map<String, dynamic>? data;

  WorkernNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.seen = false,
    this.imageUrl,
    this.data,
  });

  /// Create from Firestore document data
  factory WorkernNotification.fromFirestore(Map<String, dynamic> json) {
    return WorkernNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
      seen: json['seen'] ?? false,
      imageUrl: json['imageUrl'],
      data: json['data'],
    );
  }

  /// Convert to Firestore document format
  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'type': type,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'seen': seen,
      'imageUrl': imageUrl,
      'data': data,
    };
  }

  /// Copy with helper for state updates and future extension
  WorkernNotification copyWith({
    String? id,
    String? title,
    String? description,
    String? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? seen,
    String? imageUrl,
    Map<String, dynamic>? data,
  }) {
    return WorkernNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      seen: seen ?? this.seen,
      imageUrl: imageUrl ?? this.imageUrl,
      data: data ?? this.data,
    );
  }
}
