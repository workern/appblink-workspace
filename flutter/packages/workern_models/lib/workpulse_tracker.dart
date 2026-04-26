import 'package:cloud_firestore/cloud_firestore.dart';
import 'base.dart';

enum WorkpulseUserRole {
  employee,
  manager,
  admin;

  String toJson() {
    switch (this) {
      case WorkpulseUserRole.employee:
        return 'EMPLOYEE';
      case WorkpulseUserRole.manager:
        return 'MANAGER';
      case WorkpulseUserRole.admin:
        return 'ADMIN';
    }
  }

  static WorkpulseUserRole fromJson(String value) {
    switch (value) {
      case 'MANAGER':
        return WorkpulseUserRole.manager;
      case 'ADMIN':
        return WorkpulseUserRole.admin;
      case 'EMPLOYEE':
      default:
        return WorkpulseUserRole.employee;
    }
  }
}

enum WorkpulseSessionStatus {
  active,
  completed;

  String toJson() {
    switch (this) {
      case WorkpulseSessionStatus.active:
        return 'ACTIVE';
      case WorkpulseSessionStatus.completed:
        return 'COMPLETED';
    }
  }

  static WorkpulseSessionStatus fromJson(String value) {
    switch (value) {
      case 'COMPLETED':
        return WorkpulseSessionStatus.completed;
      case 'ACTIVE':
      default:
        return WorkpulseSessionStatus.active;
    }
  }
}

enum WorkpulseTaskStatus {
  todo,
  inProgress,
  completed;

  String toJson() {
    switch (this) {
      case WorkpulseTaskStatus.todo:
        return 'TODO';
      case WorkpulseTaskStatus.inProgress:
        return 'IN_PROGRESS';
      case WorkpulseTaskStatus.completed:
        return 'COMPLETED';
    }
  }

  static WorkpulseTaskStatus fromJson(String value) {
    switch (value) {
      case 'IN_PROGRESS':
        return WorkpulseTaskStatus.inProgress;
      case 'COMPLETED':
        return WorkpulseTaskStatus.completed;
      case 'TODO':
      default:
        return WorkpulseTaskStatus.todo;
    }
  }
}

DateTime _parseDate(dynamic value) {
  if (value is Timestamp) {
    return value.toDate();
  }
  if (value is DateTime) {
    return value;
  }
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

class WorkpulseSession extends Base {
  final String userId;
  final String dateKey;
  final WorkpulseSessionStatus status;
  final DateTime loginAt;
  final DateTime? logoutAt;
  final DateTime? lastActivityAt;
  final int totalSeconds;
  final int idleSeconds;
  final int activeSeconds;
  final int activitySignals;
  final String? locationLabel;

  WorkpulseSession({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.dateKey,
    required this.status,
    required this.loginAt,
    this.logoutAt,
    this.lastActivityAt,
    required this.totalSeconds,
    required this.idleSeconds,
    required this.activeSeconds,
    required this.activitySignals,
    this.locationLabel,
  });

  factory WorkpulseSession.fromJson(Map<String, dynamic> json) {
    return WorkpulseSession(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      dateKey: json['dateKey'] ?? '',
      status: WorkpulseSessionStatus.fromJson(json['status'] ?? 'ACTIVE'),
      loginAt: _parseDate(json['loginAt']),
      logoutAt: json['logoutAt'] == null ? null : _parseDate(json['logoutAt']),
      lastActivityAt: json['lastActivityAt'] == null
          ? null
          : _parseDate(json['lastActivityAt']),
      totalSeconds: (json['totalSeconds'] ?? 0) as int,
      idleSeconds: (json['idleSeconds'] ?? 0) as int,
      activeSeconds: (json['activeSeconds'] ?? 0) as int,
      activitySignals: (json['activitySignals'] ?? 0) as int,
      locationLabel: json['locationLabel'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'dateKey': dateKey,
      'status': status.toJson(),
      'loginAt': Timestamp.fromDate(loginAt),
      'logoutAt': logoutAt == null ? null : Timestamp.fromDate(logoutAt!),
      'lastActivityAt': lastActivityAt == null
          ? null
          : Timestamp.fromDate(lastActivityAt!),
      'totalSeconds': totalSeconds,
      'idleSeconds': idleSeconds,
      'activeSeconds': activeSeconds,
      'activitySignals': activitySignals,
      'locationLabel': locationLabel,
    };
  }
}

class WorkpulseTask extends Base {
  final String userId;
  final String dateKey;
  final String title;
  final String? description;
  final WorkpulseTaskStatus status;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final String? sessionId;
  final int secondsSpent;

  WorkpulseTask({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.dateKey,
    required this.title,
    this.description,
    required this.status,
    this.startedAt,
    this.endedAt,
    this.sessionId,
    required this.secondsSpent,
  });

  factory WorkpulseTask.fromJson(Map<String, dynamic> json) {
    return WorkpulseTask(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      dateKey: json['dateKey'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] as String?,
      status: WorkpulseTaskStatus.fromJson(json['status'] ?? 'TODO'),
      startedAt:
          json['startedAt'] == null ? null : _parseDate(json['startedAt']),
      endedAt: json['endedAt'] == null ? null : _parseDate(json['endedAt']),
      sessionId: json['sessionId'] as String?,
      secondsSpent: (json['secondsSpent'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'dateKey': dateKey,
      'title': title,
      'description': description,
      'status': status.toJson(),
      'startedAt': startedAt == null ? null : Timestamp.fromDate(startedAt!),
      'endedAt': endedAt == null ? null : Timestamp.fromDate(endedAt!),
      'sessionId': sessionId,
      'secondsSpent': secondsSpent,
    };
  }
}

class WorkpulseUserProfile extends Base {
  final String userId;
  final WorkpulseUserRole role;
  final String displayName;
  final String? email;
  final DateTime? privacyNoticeAcceptedAt;

  WorkpulseUserProfile({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.role,
    required this.displayName,
    this.email,
    this.privacyNoticeAcceptedAt,
  });

  factory WorkpulseUserProfile.fromJson(Map<String, dynamic> json) {
    return WorkpulseUserProfile(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      role: WorkpulseUserRole.fromJson(json['role'] ?? 'EMPLOYEE'),
      displayName: json['displayName'] ?? '',
      email: json['email'] as String?,
      privacyNoticeAcceptedAt: json['privacyNoticeAcceptedAt'] == null
          ? null
          : _parseDate(json['privacyNoticeAcceptedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'role': role.toJson(),
      'displayName': displayName,
      'email': email,
      'privacyNoticeAcceptedAt': privacyNoticeAcceptedAt == null
          ? null
          : Timestamp.fromDate(privacyNoticeAcceptedAt!),
    };
  }
}

class WorkpulseTeamHours {
  final String userId;
  final String displayName;
  final int totalSeconds;
  final int activeSeconds;
  final int idleSeconds;

  WorkpulseTeamHours({
    required this.userId,
    required this.displayName,
    required this.totalSeconds,
    required this.activeSeconds,
    required this.idleSeconds,
  });

  factory WorkpulseTeamHours.fromJson(Map<String, dynamic> json) {
    return WorkpulseTeamHours(
      userId: json['userId'] ?? '',
      displayName: json['displayName'] ?? '',
      totalSeconds: (json['totalSeconds'] ?? 0) as int,
      activeSeconds: (json['activeSeconds'] ?? 0) as int,
      idleSeconds: (json['idleSeconds'] ?? 0) as int,
    );
  }
}
