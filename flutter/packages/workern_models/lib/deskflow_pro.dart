import 'base.dart';

enum DeskflowCleanupImpact {
  low,
  medium,
  high;

  String toJson() {
    switch (this) {
      case DeskflowCleanupImpact.low:
        return 'LOW';
      case DeskflowCleanupImpact.medium:
        return 'MEDIUM';
      case DeskflowCleanupImpact.high:
        return 'HIGH';
    }
  }

  static DeskflowCleanupImpact fromJson(String value) {
    switch (value) {
      case 'MEDIUM':
        return DeskflowCleanupImpact.medium;
      case 'HIGH':
        return DeskflowCleanupImpact.high;
      case 'LOW':
      default:
        return DeskflowCleanupImpact.low;
    }
  }
}

enum DeskflowClipboardScope {
  localDevice,
  connectedDevice;

  String toJson() {
    switch (this) {
      case DeskflowClipboardScope.localDevice:
        return 'LOCAL_DEVICE';
      case DeskflowClipboardScope.connectedDevice:
        return 'CONNECTED_DEVICE';
    }
  }

  static DeskflowClipboardScope fromJson(String value) {
    switch (value) {
      case 'CONNECTED_DEVICE':
        return DeskflowClipboardScope.connectedDevice;
      case 'LOCAL_DEVICE':
      default:
        return DeskflowClipboardScope.localDevice;
    }
  }
}

DateTime _parseDate(dynamic value) {
  if (value is DateTime) {
    return value;
  }
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}

class DeskflowDeviceStatus extends Base {
  final String userId;
  final String deviceId;
  final String deviceName;
  final String platform;
  final int availableStorageBytes;
  final int totalStorageBytes;
  final double networkDownMbps;
  final double networkUpMbps;
  final DateTime sampledAt;

  DeskflowDeviceStatus({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.deviceId,
    required this.deviceName,
    required this.platform,
    required this.availableStorageBytes,
    required this.totalStorageBytes,
    required this.networkDownMbps,
    required this.networkUpMbps,
    required this.sampledAt,
  });

  factory DeskflowDeviceStatus.fromJson(Map<String, dynamic> json) {
    return DeskflowDeviceStatus(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      deviceId: json['deviceId'] ?? '',
      deviceName: json['deviceName'] ?? '',
      platform: json['platform'] ?? '',
      availableStorageBytes: (json['availableStorageBytes'] ?? 0) as int,
      totalStorageBytes: (json['totalStorageBytes'] ?? 0) as int,
      networkDownMbps: ((json['networkDownMbps'] ?? 0) as num).toDouble(),
      networkUpMbps: ((json['networkUpMbps'] ?? 0) as num).toDouble(),
      sampledAt: _parseDate(json['sampledAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'deviceId': deviceId,
      'deviceName': deviceName,
      'platform': platform,
      'availableStorageBytes': availableStorageBytes,
      'totalStorageBytes': totalStorageBytes,
      'networkDownMbps': networkDownMbps,
      'networkUpMbps': networkUpMbps,
      'sampledAt': sampledAt.toIso8601String(),
    };
  }
}

class DeskflowCleanupSuggestion extends Base {
  final String userId;
  final String deviceId;
  final String title;
  final String reason;
  final int estimatedBytesFreed;
  final DeskflowCleanupImpact impact;
  final String? actionPath;

  DeskflowCleanupSuggestion({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.deviceId,
    required this.title,
    required this.reason,
    required this.estimatedBytesFreed,
    required this.impact,
    this.actionPath,
  });

  factory DeskflowCleanupSuggestion.fromJson(Map<String, dynamic> json) {
    return DeskflowCleanupSuggestion(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      deviceId: json['deviceId'] ?? '',
      title: json['title'] ?? '',
      reason: json['reason'] ?? '',
      estimatedBytesFreed: (json['estimatedBytesFreed'] ?? 0) as int,
      impact: DeskflowCleanupImpact.fromJson(json['impact'] ?? 'LOW'),
      actionPath: json['actionPath'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'deviceId': deviceId,
      'title': title,
      'reason': reason,
      'estimatedBytesFreed': estimatedBytesFreed,
      'impact': impact.toJson(),
      'actionPath': actionPath,
    };
  }
}

class DeskflowClipboardItem extends Base {
  final String userId;
  final String text;
  final String preview;
  final String sourceDeviceId;
  final String sourceDeviceName;
  final DeskflowClipboardScope scope;
  final bool isFavorite;
  final DateTime copiedAt;

  DeskflowClipboardItem({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.userId,
    required this.text,
    required this.preview,
    required this.sourceDeviceId,
    required this.sourceDeviceName,
    required this.scope,
    required this.isFavorite,
    required this.copiedAt,
  });

  factory DeskflowClipboardItem.fromJson(Map<String, dynamic> json) {
    return DeskflowClipboardItem(
      id: json['id'] ?? '',
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      owner: BaseOwner.fromJson(json['owner'] ?? const {}),
      space: BaseSpace.fromJson(json['space'] ?? const {}),
      userId: json['userId'] ?? '',
      text: json['text'] ?? '',
      preview: json['preview'] ?? '',
      sourceDeviceId: json['sourceDeviceId'] ?? '',
      sourceDeviceName: json['sourceDeviceName'] ?? '',
      scope: DeskflowClipboardScope.fromJson(json['scope'] ?? 'LOCAL_DEVICE'),
      isFavorite: json['isFavorite'] == true,
      copiedAt: _parseDate(json['copiedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'userId': userId,
      'text': text,
      'preview': preview,
      'sourceDeviceId': sourceDeviceId,
      'sourceDeviceName': sourceDeviceName,
      'scope': scope.toJson(),
      'isFavorite': isFavorite,
      'copiedAt': copiedAt.toIso8601String(),
    };
  }
}
