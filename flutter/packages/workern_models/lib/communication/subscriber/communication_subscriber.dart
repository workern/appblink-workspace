import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../../common/base.dart';

/// How this subscriber was added to the workspace's audience.
enum CommunicationSubscriberSource { ORDER, EXPLICIT }

CommunicationSubscriberSource communicationSubscriberSourceFromString(
  String value,
) {
  return CommunicationSubscriberSource.values.firstWhere(
    (e) => e.name == value,
    orElse: () => CommunicationSubscriberSource.ORDER,
  );
}

/// A subscriber entry in a workspace's audience.
///
/// Stored at:
///   apps/{appId}/workspaces/{workspaceId}/subscribers/{userId}
///   users/{userId}/mySpaces/{appId}/subscribers/{workspaceId}      ← user view
///   users/{ownerId}/mySpaces/{appId}/workspaceSubscribers/{userId} ← owner view
///
/// Only subscribers with [consentGiven] == true may receive campaigns
/// or push notification broadcasts from the workspace.
class CommunicationSubscriber extends Base {
  /// Firebase UID of the subscribing customer
  final String userId;

  /// ID of the workspace they subscribed to
  final String workspaceId;

  /// Display name of the subscriber
  final String displayName;

  /// Phone number — required for WhatsApp campaigns
  final String? phone;

  /// E-mail — optional, for future email channel
  final String? email;

  /// Whether the subscriber consented to receive marketing communications.
  /// Only [consentGiven] == true subscribers may be targeted for campaigns.
  final bool consentGiven;

  /// Which action caused this entry to be created or last updated
  final CommunicationSubscriberSource source;

  /// ISO timestamp of when the subscriber most recently interacted
  final DateTime lastInteractionAt;

  /// Audience tags assigned by the shop owner (e.g. "VIP", "Summer Sale").
  /// Used to filter campaign targets.
  final List<String> tags;

  CommunicationSubscriber({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.owner,
    super.space,
    required this.userId,
    required this.workspaceId,
    required this.displayName,
    this.phone,
    this.email,
    required this.consentGiven,
    required this.source,
    required this.lastInteractionAt,
    this.tags = const [],
  });

  factory CommunicationSubscriber.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);
    return CommunicationSubscriber(
      id: base['id'] as String,
      createdAt: base['createdAt'] as DateTime,
      updatedAt: base['updatedAt'] as DateTime,
      owner: base['owner'] as BaseOwner?,
      space: base['space'] as BaseSpace?,
      userId: json['userId'] as String? ?? '',
      workspaceId: json['workspaceId'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      consentGiven: json['consentGiven'] as bool? ?? false,
      source: communicationSubscriberSourceFromString(
        json['source'] as String? ?? '',
      ),
      lastInteractionAt: (json['lastInteractionAt'] is Timestamp)
          ? (json['lastInteractionAt'] as Timestamp).toDate()
          : parseTimestamp(json['lastInteractionAt']) ?? DateTime.now(),
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'userId': userId,
    'workspaceId': workspaceId,
    'displayName': displayName,
    if (phone != null) 'phone': phone,
    if (email != null) 'email': email,
    'consentGiven': consentGiven,
    'source': source.name,
    'lastInteractionAt': Timestamp.fromDate(lastInteractionAt),
    'tags': tags,
    if (owner != null) 'owner': owner!.toJson(),
    if (space != null) 'space': space!.toJson(),
  };

  CommunicationSubscriber copyWith({
    bool? consentGiven,
    CommunicationSubscriberSource? source,
    DateTime? lastInteractionAt,
    List<String>? tags,
  }) {
    return CommunicationSubscriber(
      id: id,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      owner: owner,
      space: space,
      userId: userId,
      workspaceId: workspaceId,
      displayName: displayName,
      phone: phone,
      email: email,
      consentGiven: consentGiven ?? this.consentGiven,
      source: source ?? this.source,
      lastInteractionAt: lastInteractionAt ?? this.lastInteractionAt,
      tags: tags ?? this.tags,
    );
  }
}
