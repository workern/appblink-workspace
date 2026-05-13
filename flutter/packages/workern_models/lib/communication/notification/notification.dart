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
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toDate().toString())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toDate().toString())
          : DateTime.now(),
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
}
