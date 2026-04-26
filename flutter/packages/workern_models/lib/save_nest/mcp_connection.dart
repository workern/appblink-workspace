import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../base.dart';

/// An active MCP connection from an external application to Save Nest.
/// Stored at: users/{userId}/mySpaces/save-nest/mcpConnections/{connectionId}
///
/// The actual bearer token is returned ONCE at connection creation and stored
/// here only as a SHA-256 hash. The external app must store the raw token.
///
/// MUST stay in sync with TypeScript McpConnection in libs/shared/models
class McpConnection extends Base {
  /// User-given label, e.g. "VSCode – Work Laptop"
  final String name;

  /// Name of the connecting client application
  final String? appName;

  /// If present, only saves in this skill are exposed
  final String? skillId;

  /// Category filter; empty list = all categories
  final List<String> categories;

  /// SHA-256 hash of the bearer token (never store plaintext on client)
  final String tokenHash;
  final DateTime connectedAt;
  final DateTime? lastAccessedAt;

  McpConnection({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.name,
    this.appName,
    this.skillId,
    required this.categories,
    required this.tokenHash,
    required this.connectedAt,
    this.lastAccessedAt,
  });

  factory McpConnection.fromFirestore(Map<String, dynamic> data, String id) {
    final baseFields = Base.parseBaseFields({...data, 'id': id});
    return McpConnection(
      id: id,
      createdAt: parseTimestamp(baseFields['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(baseFields['updatedAt']) ?? DateTime.now(),
      owner: baseFields['owner'] ?? BaseOwner(uid: '', name: ''),
      space: baseFields['space'] ?? BaseSpace(id: 'save-nest'),
      name: data['name'] as String? ?? '',
      appName: data['appName'] as String?,
      skillId: data['skillId'] as String?,
      categories: List<String>.from(data['categories'] as List? ?? []),
      tokenHash: data['tokenHash'] as String? ?? '',
      connectedAt: parseTimestamp(data['connectedAt']) ?? DateTime.now(),
      lastAccessedAt: parseTimestamp(data['lastAccessedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
    'owner': owner.toJson(),
    'space': space.toJson(),
    'name': name,
    if (appName != null) 'appName': appName,
    if (skillId != null) 'skillId': skillId,
    'categories': categories,
    'tokenHash': tokenHash,
    'connectedAt': Timestamp.fromDate(connectedAt),
    if (lastAccessedAt != null)
      'lastAccessedAt': Timestamp.fromDate(lastAccessedAt!),
  };
}
