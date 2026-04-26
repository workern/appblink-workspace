import '../base.dart';

/// Represents a user's query in the Save Nest app
/// Stored at users/{userId}/mySpaces/save-nest/queries/{queryId}
class UserQuery extends Base {
  final String query;
  final DateTime timestamp;
  final String userId;
  final List<double>?
  embeddings; // Vector embeddings for semantic search (2048-dimensional)

  UserQuery({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.query,
    required this.timestamp,
    required this.userId,
    this.embeddings,
  });

  factory UserQuery.fromJson(Map<String, dynamic> json) {
    return UserQuery(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      owner: BaseOwner.fromJson(json['owner'] as Map<String, dynamic>),
      space: BaseSpace.fromJson(json['space'] as Map<String, dynamic>),
      query: json['query'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      userId: json['userId'] as String,
      embeddings: json['embeddings'] != null
          ? List<double>.from(json['embeddings'] as List)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'query': query,
      'timestamp': timestamp.toIso8601String(),
      'userId': userId,
      if (embeddings != null) 'embeddings': embeddings,
    };
  }
}

/// Represents a quick action suggestion for the user
/// Stored at users/{userId}/mySpaces/save-nest/quickActions/{id}
class QuickAction extends Base {
  final String displayQuery; // User-friendly text to display on frontend
  final String query; // Actual search query to execute
  final String
  type; // The save type for this action (SaveType enum value as string)
  final int frequency;
  final DateTime lastUsed;
  final int rank; // 1, 2, or 3 for top 3 actions

  QuickAction({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.displayQuery,
    required this.query,
    required this.type,
    required this.frequency,
    required this.lastUsed,
    required this.rank,
  });

  factory QuickAction.fromJson(Map<String, dynamic> json) {
    return QuickAction(
      id: json['id'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      owner: BaseOwner.fromJson(json['owner'] as Map<String, dynamic>),
      space: BaseSpace.fromJson(json['space'] as Map<String, dynamic>),
      displayQuery: json['displayQuery'] as String,
      query: json['query'] as String,
      type: json['type'] as String,
      frequency: json['frequency'] as int,
      lastUsed: DateTime.parse(json['lastUsed'] as String),
      rank: json['rank'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'displayQuery': displayQuery,
      'query': query,
      'type': type,
      'frequency': frequency,
      'lastUsed': lastUsed.toIso8601String(),
      'rank': rank,
    };
  }
}
