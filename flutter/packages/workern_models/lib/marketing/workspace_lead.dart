import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';

enum LeadStatus { newLead, reviewed, contacted, dismissed }

extension LeadStatusX on LeadStatus {
  String get value {
    switch (this) {
      case LeadStatus.newLead:
        return 'new';
      case LeadStatus.reviewed:
        return 'reviewed';
      case LeadStatus.contacted:
        return 'contacted';
      case LeadStatus.dismissed:
        return 'dismissed';
    }
  }

  static LeadStatus fromString(String v) {
    switch (v) {
      case 'reviewed':
        return LeadStatus.reviewed;
      case 'contacted':
        return LeadStatus.contacted;
      case 'dismissed':
        return LeadStatus.dismissed;
      default:
        return LeadStatus.newLead;
    }
  }
}

class WorkspaceLeadPost {
  final String id;
  final String title;
  final String description;
  final String? subReddit;
  final String? url;
  final DateTime? createdAt;

  const WorkspaceLeadPost({
    required this.id,
    required this.title,
    required this.description,
    this.subReddit,
    this.url,
    this.createdAt,
  });

  factory WorkspaceLeadPost.fromJson(Map<String, dynamic> json) {
    return WorkspaceLeadPost(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      subReddit: json['subReddit'],
      url: json['url'],
      createdAt: json['createdAt'] != null
          ? parseTimestamp(json['createdAt'])
          : null,
    );
  }
}

class WorkspaceLead {
  final String id;
  final String name;
  final String externalLink;
  final String source;
  final double relevanceScore;
  final LeadStatus status;
  final DateTime? interestShownAt;
  final WorkspaceLeadPost sourcePost;
  final String spaceId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const WorkspaceLead({
    required this.id,
    required this.name,
    required this.externalLink,
    required this.source,
    required this.relevanceScore,
    required this.status,
    this.interestShownAt,
    required this.sourcePost,
    required this.spaceId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WorkspaceLead.fromJson(Map<String, dynamic> json) {
    return WorkspaceLead(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      externalLink: json['externalLink'] ?? '',
      source: json['source'] ?? 'reddit',
      relevanceScore: (json['relevanceScore'] as num?)?.toDouble() ?? 0.0,
      status: LeadStatusX.fromString(json['status'] ?? 'new'),
      interestShownAt: parseTimestamp(json['interestShownAt']),
      sourcePost: WorkspaceLeadPost.fromJson(
          (json['sourcePost'] as Map<String, dynamic>?) ?? {}),
      spaceId: (json['space'] as Map<String, dynamic>?)?['id'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
    );
  }

  WorkspaceLead copyWith({LeadStatus? status}) {
    return WorkspaceLead(
      id: id,
      name: name,
      externalLink: externalLink,
      source: source,
      relevanceScore: relevanceScore,
      status: status ?? this.status,
      interestShownAt: interestShownAt,
      sourcePost: sourcePost,
      spaceId: spaceId,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
