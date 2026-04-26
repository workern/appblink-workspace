import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';

/// Owner reference in Base model
class BaseOwner {
  final String uid;
  final String name;

  BaseOwner({required this.uid, required this.name});

  factory BaseOwner.fromJson(Map<String, dynamic> json) {
    return BaseOwner(uid: json['uid'] ?? '', name: json['name'] ?? '');
  }

  Map<String, dynamic> toJson() => {'uid': uid, 'name': name};
}

/// Space reference in Base model
class BaseSpace {
  final String id;

  BaseSpace({required this.id});

  factory BaseSpace.fromJson(Map<String, dynamic> json) {
    return BaseSpace(id: json['id'] ?? '');
  }

  Map<String, dynamic> toJson() => {'id': id};
}

/// Base model matching TypeScript Base interface
/// Contains common fields for all models: id, createdAt, updatedAt, owner, space
abstract class Base {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final BaseOwner owner;
  final BaseSpace space;

  Base({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.owner,
    required this.space,
  });

  /// Helper method to parse base fields from JSON
  static Map<String, dynamic> parseBaseFields(Map<String, dynamic> json) {
    return {
      'id': json['id'],
      'createdAt': parseTimestamp(json['createdAt']),
      'updatedAt': parseTimestamp(json['updatedAt']),
      'owner': json['owner'] != null ? BaseOwner.fromJson(json['owner']) : null,
      'space': json['space'] != null ? BaseSpace.fromJson(json['space']) : null,
    };
  }

  /// Helper method to convert base fields to JSON
  Map<String, dynamic> baseToJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt!),
      'updatedAt': Timestamp.fromDate(updatedAt!),
      'owner': owner!.toJson(),
      'space': space!.toJson(),
    };
  }
}
