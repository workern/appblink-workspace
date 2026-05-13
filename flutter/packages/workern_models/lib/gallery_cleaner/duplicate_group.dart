import '../common/base.dart';
import 'media_item.dart';

class DuplicateGroup extends Base {
  final String groupId;
  final List<MediaItem> items;
  final String reason;

  DuplicateGroup({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required this.groupId,
    required this.items,
    required this.reason,
  });

  factory DuplicateGroup.fromJson(Map<String, dynamic> json) => DuplicateGroup(
    id: json['id'],
    groupId: json['groupId'],
    items: (json['items'] as List).map((e) => MediaItem.fromJson(e)).toList(),
    reason: json['reason'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'groupId': groupId,
    'items': items.map((e) => e.toJson()).toList(),
    'reason': reason,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
