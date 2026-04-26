import 'package:cloud_firestore/cloud_firestore.dart';
import 'base.dart';

// ── Platform Enums ────────────────────────────────────────────────────────────

enum TurkGuruPlatform {
  mturk,
  prolific,
  cloudResearch;

  String toJson() {
    switch (this) {
      case TurkGuruPlatform.mturk:
        return 'MTURK';
      case TurkGuruPlatform.prolific:
        return 'PROLIFIC';
      case TurkGuruPlatform.cloudResearch:
        return 'CLOUD_RESEARCH';
    }
  }

  static TurkGuruPlatform fromJson(String value) {
    switch (value) {
      case 'PROLIFIC':
        return TurkGuruPlatform.prolific;
      case 'CLOUD_RESEARCH':
        return TurkGuruPlatform.cloudResearch;
      case 'MTURK':
      default:
        return TurkGuruPlatform.mturk;
    }
  }

  String get displayName {
    switch (this) {
      case TurkGuruPlatform.mturk:
        return 'Amazon MTurk';
      case TurkGuruPlatform.prolific:
        return 'Prolific';
      case TurkGuruPlatform.cloudResearch:
        return 'Cloud Research';
    }
  }
}

enum TurkGuruAccountStatus {
  active,
  inactive,
  error;

  String toJson() {
    switch (this) {
      case TurkGuruAccountStatus.active:
        return 'ACTIVE';
      case TurkGuruAccountStatus.inactive:
        return 'INACTIVE';
      case TurkGuruAccountStatus.error:
        return 'ERROR';
    }
  }

  static TurkGuruAccountStatus fromJson(String value) {
    switch (value) {
      case 'INACTIVE':
        return TurkGuruAccountStatus.inactive;
      case 'ERROR':
        return TurkGuruAccountStatus.error;
      case 'ACTIVE':
      default:
        return TurkGuruAccountStatus.active;
    }
  }
}

enum TurkGuruTaskStatus {
  available,
  expired,
  seen;

  String toJson() {
    switch (this) {
      case TurkGuruTaskStatus.available:
        return 'AVAILABLE';
      case TurkGuruTaskStatus.expired:
        return 'EXPIRED';
      case TurkGuruTaskStatus.seen:
        return 'SEEN';
    }
  }

  static TurkGuruTaskStatus fromJson(String value) {
    switch (value) {
      case 'EXPIRED':
        return TurkGuruTaskStatus.expired;
      case 'SEEN':
        return TurkGuruTaskStatus.seen;
      case 'AVAILABLE':
      default:
        return TurkGuruTaskStatus.available;
    }
  }
}

// ── Models ────────────────────────────────────────────────────────────────────

/// A connected platform account.
/// Stored at: users/{uid}/mySpaces/turkGuru/accounts/{id}
class TurkGuruAccount extends Base {
  final TurkGuruPlatform platform;
  final String nickname;
  final TurkGuruAccountStatus status;
  final String? errorMessage;
  final DateTime? lastCheckedAt;

  TurkGuruAccount({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.platform,
    required this.nickname,
    required this.status,
    this.errorMessage,
    this.lastCheckedAt,
  });

  factory TurkGuruAccount.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);
    return TurkGuruAccount(
      id: base['id'] ?? '',
      createdAt: base['createdAt'] ?? DateTime.now(),
      updatedAt: base['updatedAt'] ?? DateTime.now(),
      owner: base['owner'] ?? BaseOwner(uid: '', name: ''),
      space: base['space'] ?? BaseSpace(id: ''),
      platform: TurkGuruPlatform.fromJson(json['platform'] ?? 'MTURK'),
      nickname: json['nickname'] ?? '',
      status: TurkGuruAccountStatus.fromJson(json['status'] ?? 'ACTIVE'),
      errorMessage: json['errorMessage'],
      lastCheckedAt: _parseOptionalDate(json['lastCheckedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
    ...baseToJson(),
    'platform': platform.toJson(),
    'nickname': nickname,
    'status': status.toJson(),
    if (errorMessage != null) 'errorMessage': errorMessage,
    if (lastCheckedAt != null)
      'lastCheckedAt': lastCheckedAt!.toIso8601String(),
  };
}

/// User notification and monitoring preferences.
/// Stored at: users/{uid}/mySpaces/turkGuru/settings/preferences
class TurkGuruSettings {
  final String id;
  final String userId;
  final int minRewardCents;
  final List<TurkGuruPlatform> enabledPlatforms;
  final List<String> taskKeywordFilters;
  final int monitoringIntervalMinutes;
  final bool notificationsEnabled;
  final DateTime updatedAt;

  TurkGuruSettings({
    required this.id,
    required this.userId,
    required this.minRewardCents,
    required this.enabledPlatforms,
    required this.taskKeywordFilters,
    required this.monitoringIntervalMinutes,
    required this.notificationsEnabled,
    required this.updatedAt,
  });

  factory TurkGuruSettings.defaultSettings(String userId) => TurkGuruSettings(
    id: 'preferences',
    userId: userId,
    minRewardCents: 50,
    enabledPlatforms: TurkGuruPlatform.values,
    taskKeywordFilters: [],
    monitoringIntervalMinutes: 5,
    notificationsEnabled: true,
    updatedAt: DateTime.now(),
  );

  factory TurkGuruSettings.fromJson(Map<String, dynamic> json) {
    return TurkGuruSettings(
      id: json['id'] ?? 'preferences',
      userId: json['userId'] ?? '',
      minRewardCents: (json['minRewardCents'] as num?)?.toInt() ?? 50,
      enabledPlatforms:
          (json['enabledPlatforms'] as List<dynamic>?)
              ?.map((e) => TurkGuruPlatform.fromJson(e as String))
              .toList() ??
          TurkGuruPlatform.values,
      taskKeywordFilters:
          (json['taskKeywordFilters'] as List<dynamic>?)?.cast<String>() ?? [],
      monitoringIntervalMinutes:
          (json['monitoringIntervalMinutes'] as num?)?.toInt() ?? 5,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      updatedAt: _parseOptionalDate(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'minRewardCents': minRewardCents,
    'enabledPlatforms': enabledPlatforms.map((p) => p.toJson()).toList(),
    'taskKeywordFilters': taskKeywordFilters,
    'monitoringIntervalMinutes': monitoringIntervalMinutes,
    'notificationsEnabled': notificationsEnabled,
    'updatedAt': updatedAt.toIso8601String(),
  };

  TurkGuruSettings copyWith({
    int? minRewardCents,
    List<TurkGuruPlatform>? enabledPlatforms,
    List<String>? taskKeywordFilters,
    int? monitoringIntervalMinutes,
    bool? notificationsEnabled,
  }) => TurkGuruSettings(
    id: id,
    userId: userId,
    minRewardCents: minRewardCents ?? this.minRewardCents,
    enabledPlatforms: enabledPlatforms ?? this.enabledPlatforms,
    taskKeywordFilters: taskKeywordFilters ?? this.taskKeywordFilters,
    monitoringIntervalMinutes:
        monitoringIntervalMinutes ?? this.monitoringIntervalMinutes,
    notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
    updatedAt: DateTime.now(),
  );
}

/// A discovered task from a connected platform.
/// Stored at: users/{uid}/mySpaces/turkGuru/tasks/{id}
class TurkGuruTask extends Base {
  final TurkGuruPlatform platform;
  final String externalId;
  final String title;
  final String? description;
  final int rewardCents;
  final String rewardDisplay;
  final String taskUrl;
  final DateTime availableAt;
  final DateTime? expiresAt;
  final TurkGuruTaskStatus status;
  final String? requesterName;
  final int? estimatedTimeMinutes;
  final List<String> qualifications;

  TurkGuruTask({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.platform,
    required this.externalId,
    required this.title,
    this.description,
    required this.rewardCents,
    required this.rewardDisplay,
    required this.taskUrl,
    required this.availableAt,
    this.expiresAt,
    required this.status,
    this.requesterName,
    this.estimatedTimeMinutes,
    this.qualifications = const [],
  });

  factory TurkGuruTask.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);
    return TurkGuruTask(
      id: base['id'] ?? '',
      createdAt: base['createdAt'] ?? DateTime.now(),
      updatedAt: base['updatedAt'] ?? DateTime.now(),
      owner: base['owner'] ?? BaseOwner(uid: '', name: ''),
      space: base['space'] ?? BaseSpace(id: ''),
      platform: TurkGuruPlatform.fromJson(json['platform'] ?? 'MTURK'),
      externalId: json['externalId'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      rewardCents: (json['rewardCents'] as num?)?.toInt() ?? 0,
      rewardDisplay: json['rewardDisplay'] ?? '',
      taskUrl: json['taskUrl'] ?? '',
      availableAt: _parseOptionalDate(json['availableAt']) ?? DateTime.now(),
      expiresAt: _parseOptionalDate(json['expiresAt']),
      status: TurkGuruTaskStatus.fromJson(json['status'] ?? 'AVAILABLE'),
      requesterName: json['requesterName'],
      estimatedTimeMinutes: (json['estimatedTimeMinutes'] as num?)?.toInt(),
      qualifications:
          (json['qualifications'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toJson() => {
    ...baseToJson(),
    'platform': platform.toJson(),
    'externalId': externalId,
    'title': title,
    if (description != null) 'description': description,
    'rewardCents': rewardCents,
    'rewardDisplay': rewardDisplay,
    'taskUrl': taskUrl,
    'availableAt': availableAt.toIso8601String(),
    if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String(),
    'status': status.toJson(),
    if (requesterName != null) 'requesterName': requesterName,
    if (estimatedTimeMinutes != null)
      'estimatedTimeMinutes': estimatedTimeMinutes,
    'qualifications': qualifications,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

DateTime? _parseOptionalDate(dynamic value) {
  if (value == null) return null;
  if (value is Timestamp) return value.toDate();
  if (value is String) return DateTime.tryParse(value);
  return null;
}
