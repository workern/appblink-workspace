import '../common/base.dart';
import 'duplicate_group.dart';

class ScanResult extends Base {
  final String userId;
  final List<DuplicateGroup> duplicateGroups;
  final DateTime scannedAt;

  ScanResult({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required this.userId,
    required this.duplicateGroups,
    required this.scannedAt,
  });

  factory ScanResult.fromJson(Map<String, dynamic> json) => ScanResult(
    id: json['id'],
    userId: json['userId'],
    duplicateGroups: (json['duplicateGroups'] as List)
        .map((e) => DuplicateGroup.fromJson(e))
        .toList(),
    scannedAt: DateTime.parse(json['scannedAt']),
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'duplicateGroups': duplicateGroups.map((e) => e.toJson()).toList(),
    'scannedAt': scannedAt.toIso8601String(),
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
