import 'package:cloud_firestore/cloud_firestore.dart';
import 'base.dart';

enum TaskWhatsTaskStatus {
  todo,
  inProgress,
  completed;

  String toJson() {
    switch (this) {
      case TaskWhatsTaskStatus.todo:
        return 'TODO';
      case TaskWhatsTaskStatus.inProgress:
        return 'IN_PROGRESS';
      case TaskWhatsTaskStatus.completed:
        return 'COMPLETED';
    }
  }

  static TaskWhatsTaskStatus fromJson(String value) {
    switch (value) {
      case 'IN_PROGRESS':
        return TaskWhatsTaskStatus.inProgress;
      case 'COMPLETED':
        return TaskWhatsTaskStatus.completed;
      case 'TODO':
      default:
        return TaskWhatsTaskStatus.todo;
    }
  }
}

enum TaskWhatsParticipantRole {
  issuer,
  worker;

  String toJson() {
    switch (this) {
      case TaskWhatsParticipantRole.issuer:
        return 'ISSUER';
      case TaskWhatsParticipantRole.worker:
        return 'WORKER';
    }
  }

  static TaskWhatsParticipantRole fromJson(String value) {
    switch (value) {
      case 'WORKER':
        return TaskWhatsParticipantRole.worker;
      case 'ISSUER':
      default:
        return TaskWhatsParticipantRole.issuer;
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

class TaskWhatsTask extends Base {
  final String title;
  final String? description;
  final String? whatsappMessage;
  final String issuerId;
  final String issuerName;
  final String workerId;
  final String workerName;
  final List<String> participantIds;
  final TaskWhatsTaskStatus status;
  final String statusUpdatedById;
  final TaskWhatsParticipantRole statusUpdatedByRole;
  final DateTime? dueAt;
  final DateTime? completedAt;

  TaskWhatsTask({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.title,
    this.description,
    this.whatsappMessage,
    required this.issuerId,
    required this.issuerName,
    required this.workerId,
    required this.workerName,
    required this.participantIds,
    required this.status,
    required this.statusUpdatedById,
    required this.statusUpdatedByRole,
    this.dueAt,
    this.completedAt,
  });

  factory TaskWhatsTask.fromJson(Map<String, dynamic> json) {
    return TaskWhatsTask(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      title: json['title'] ?? '',
      description: json['description'] as String?,
      whatsappMessage: json['whatsappMessage'] as String?,
      issuerId: json['issuerId'] ?? '',
      issuerName: json['issuerName'] ?? '',
      workerId: json['workerId'] ?? '',
      workerName: json['workerName'] ?? '',
      participantIds: (json['participantIds'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      status: TaskWhatsTaskStatus.fromJson(json['status'] ?? 'TODO'),
      statusUpdatedById: json['statusUpdatedById'] ?? '',
      statusUpdatedByRole: TaskWhatsParticipantRole.fromJson(
        json['statusUpdatedByRole'] ?? 'ISSUER',
      ),
      dueAt: json['dueAt'] == null ? null : _parseDate(json['dueAt']),
      completedAt: json['completedAt'] == null
          ? null
          : _parseDate(json['completedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'title': title,
      'description': description,
      'whatsappMessage': whatsappMessage,
      'issuerId': issuerId,
      'issuerName': issuerName,
      'workerId': workerId,
      'workerName': workerName,
      'participantIds': participantIds,
      'status': status.toJson(),
      'statusUpdatedById': statusUpdatedById,
      'statusUpdatedByRole': statusUpdatedByRole.toJson(),
      'dueAt': dueAt == null ? null : Timestamp.fromDate(dueAt!),
      'completedAt': completedAt == null
          ? null
          : Timestamp.fromDate(completedAt!),
    };
  }
}
