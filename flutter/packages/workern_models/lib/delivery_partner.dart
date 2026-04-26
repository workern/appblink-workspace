import 'verification.dart';
import 'package:workern_utils/workern_utils.dart';

/// Delivery Partner Account Status
enum PartnerAccountStatus {
  REGISTERED,
  KYC_PENDING,
  TRAINING,
  ACTIVE,
  INACTIVE,
  SUSPENDED,
}

/// Training Status
class TrainingStatus {
  final bool isCompleted;
  final DateTime? completedAt;

  TrainingStatus({required this.isCompleted, this.completedAt});

  factory TrainingStatus.fromJson(Map<String, dynamic> json) {
    return TrainingStatus(
      isCompleted: json['isCompleted'] ?? false,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'isCompleted': isCompleted,
    if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
  };
}

/// Owner Information
class OwnerInfo {
  final String? uid;
  final String? name;

  OwnerInfo({this.uid, this.name});

  factory OwnerInfo.fromJson(Map<String, dynamic> json) {
    return OwnerInfo(uid: json['uid'], name: json['name']);
  }

  Map<String, dynamic> toJson() => {
    if (uid != null) 'uid': uid,
    if (name != null) 'name': name,
  };
}

/// Space Information
class SpaceInfo {
  final String? id;

  SpaceInfo({this.id});

  factory SpaceInfo.fromJson(Map<String, dynamic> json) {
    return SpaceInfo(id: json['id']);
  }

  Map<String, dynamic> toJson() => {if (id != null) 'id': id};
}

/// Delivery Partner model for admin management
class DeliveryPerson {
  final String? id;
  final OwnerInfo owner;
  final SpaceInfo space;
  final String? uid;
  final String? mobile;
  final String? email;
  final String? city;
  final String? workArea;
  final PartnerAccountStatus? accountStatus;
  final Verification? kycStatus;
  final TrainingStatus? training;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  DeliveryPerson({
    this.id,
    required this.owner,
    required this.space,
    this.uid,
    this.mobile,
    this.email,
    this.city,
    this.workArea,
    this.accountStatus,
    this.kycStatus,
    this.training,
    this.createdAt,
    this.updatedAt,
  });

  factory DeliveryPerson.fromJson(Map<String, dynamic> json) {
    PartnerAccountStatus? status;
    if (json['accountStatus'] != null) {
      final statusStr = json['accountStatus'].toString();
      status = PartnerAccountStatus.values.firstWhere(
        (e) => e.name == statusStr,
        orElse: () => PartnerAccountStatus.REGISTERED,
      );
    }

    return DeliveryPerson(
      id: json['id'],
      owner: json['owner'] != null
          ? OwnerInfo.fromJson(json['owner'])
          : OwnerInfo(),
      space: json['space'] != null
          ? SpaceInfo.fromJson(json['space'])
          : SpaceInfo(),
      uid: json['uid'],
      mobile: json['mobile'],
      email: json['email'],
      city: json['city'],
      workArea: json['workArea'],
      accountStatus: status,
      kycStatus: json['kycStatus'] != null
          ? Verification.fromJson(json['kycStatus'])
          : null,
      training: json['training'] != null
          ? TrainingStatus.fromJson(json['training'])
          : null,
      createdAt: parseTimestamp(json['createdAt']),
      updatedAt: parseTimestamp(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'owner': owner.toJson(),
    'space': space.toJson(),
    if (uid != null) 'uid': uid,
    if (mobile != null) 'mobile': mobile,
    if (email != null) 'email': email,
    if (city != null) 'city': city,
    if (workArea != null) 'workArea': workArea,
    if (accountStatus != null) 'accountStatus': accountStatus!.name,
    if (kycStatus != null) 'kycStatus': kycStatus!.toJson(),
    if (training != null) 'training': training!.toJson(),
    if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
  };
}
