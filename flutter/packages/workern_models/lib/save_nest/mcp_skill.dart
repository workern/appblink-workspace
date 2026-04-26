import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../base.dart';

/// A user-created named collection of saves that can be exposed via MCP.
/// Stored at: users/{userId}/mySpaces/save-nest/skills/{skillId}
///
/// MUST stay in sync with TypeScript McpSkill in libs/shared/models
class McpSkill extends Base {
  final String name;
  final String? description;

  /// Emoji or icon identifier
  final String? icon;

  /// Referenced SmartSave IDs belonging to this skill
  final List<String> saveIds;

  /// Auto-categorized topic labels, e.g. 'coding', 'travel', 'fitness'
  final List<String> categories;

  /// Future: allow sharing a skill publicly
  final bool isPublic;

  /// Cached markdown generated from the saves currently attached to this skill.
  final String? summaryMarkdown;

  /// Worker lifecycle for cached skill summary generation.
  final String? summaryStatus;

  /// Hash of the inputs used to produce the current cached summary.
  final String? summaryInputHash;

  /// Last worker error, if summary generation failed.
  final String? summaryError;

  /// Number of analyzed saves included in the cached summary.
  final int? summarySaveCount;

  /// Timestamp for the most recent successful cache generation.
  final DateTime? summaryGeneratedAt;

  McpSkill({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.name,
    this.description,
    this.icon,
    required this.saveIds,
    required this.categories,
    required this.isPublic,
    this.summaryMarkdown,
    this.summaryStatus,
    this.summaryInputHash,
    this.summaryError,
    this.summarySaveCount,
    this.summaryGeneratedAt,
  });

  factory McpSkill.fromFirestore(Map<String, dynamic> data, String id) {
    final baseFields = Base.parseBaseFields({...data, 'id': id});
    return McpSkill(
      id: id,
      createdAt: parseTimestamp(baseFields['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(baseFields['updatedAt']) ?? DateTime.now(),
      owner: baseFields['owner'] ?? BaseOwner(uid: '', name: ''),
      space: baseFields['space'] ?? BaseSpace(id: 'save-nest'),
      name: data['name'] as String? ?? '',
      description: data['description'] as String?,
      icon: data['icon'] as String?,
      saveIds: List<String>.from(data['saveIds'] as List? ?? []),
      categories: List<String>.from(data['categories'] as List? ?? []),
      isPublic: data['isPublic'] as bool? ?? false,
      summaryMarkdown: data['summaryMarkdown'] as String?,
      summaryStatus: data['summaryStatus'] as String?,
      summaryInputHash: data['summaryInputHash'] as String?,
      summaryError: data['summaryError'] as String?,
      summarySaveCount: data['summarySaveCount'] as int?,
      summaryGeneratedAt: parseTimestamp(data['summaryGeneratedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
    'owner': owner.toJson(),
    'space': space.toJson(),
    'name': name,
    if (description != null) 'description': description,
    if (icon != null) 'icon': icon,
    'saveIds': saveIds,
    'categories': categories,
    'isPublic': isPublic,
    if (summaryMarkdown != null) 'summaryMarkdown': summaryMarkdown,
    if (summaryStatus != null) 'summaryStatus': summaryStatus,
    if (summaryInputHash != null) 'summaryInputHash': summaryInputHash,
    if (summaryError != null) 'summaryError': summaryError,
    if (summarySaveCount != null) 'summarySaveCount': summarySaveCount,
    if (summaryGeneratedAt != null)
      'summaryGeneratedAt': Timestamp.fromDate(summaryGeneratedAt!),
  };

  McpSkill copyWith({
    String? name,
    String? description,
    String? icon,
    List<String>? saveIds,
    List<String>? categories,
    bool? isPublic,
    String? summaryMarkdown,
    String? summaryStatus,
    String? summaryInputHash,
    String? summaryError,
    int? summarySaveCount,
    DateTime? summaryGeneratedAt,
  }) {
    return McpSkill(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      owner: owner,
      space: space,
      name: name ?? this.name,
      description: description ?? this.description,
      icon: icon ?? this.icon,
      saveIds: saveIds ?? this.saveIds,
      categories: categories ?? this.categories,
      isPublic: isPublic ?? this.isPublic,
      summaryMarkdown: summaryMarkdown ?? this.summaryMarkdown,
      summaryStatus: summaryStatus ?? this.summaryStatus,
      summaryInputHash: summaryInputHash ?? this.summaryInputHash,
      summaryError: summaryError ?? this.summaryError,
      summarySaveCount: summarySaveCount ?? this.summarySaveCount,
      summaryGeneratedAt: summaryGeneratedAt ?? this.summaryGeneratedAt,
    );
  }
}
