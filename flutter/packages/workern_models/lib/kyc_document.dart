import 'package:workern_utils/workern_utils.dart';
import 'verification_status.dart';

enum KycDocumentType {
  AADHAR,
  PAN,
  DRIVING_LICENSE,
  VEHICLE_RC,
  PHOTO,
  SHOP_ACT,
  SHOP_IMAGE,
  ID_PROOF,
  OTHER,
}

/// KYC Document Status
enum KycDocumentStatus { pending, approved, rejected }

/// KYC Document model
class KycDocument {
  final String? id;
  final KycDocumentType? type;
  final String? storageUrl;
  final DateTime? uploadedAt;
  final VerificationStatus? status;
  final String? rejectionReason;

  KycDocument({
    this.id,
    this.type,
    this.storageUrl,
    this.uploadedAt,
    this.status,
    this.rejectionReason,
  });

  factory KycDocument.fromJson(Map<String, dynamic> json) {
    KycDocumentType? docType;
    if (json['type'] != null) {
      final typeStr = json['type'].toString().toUpperCase();
      try {
        docType = KycDocumentType.values.firstWhere(
          (e) => e.name == typeStr,
          orElse: () => KycDocumentType.OTHER,
        );
      } catch (e) {
        docType = KycDocumentType.OTHER;
      }
    }

    DateTime? uploadTime;
    if (json['uploadedAt'] != null) {
      uploadTime = parseTimestamp(json['uploadedAt']);
    }

    VerificationStatus? docStatus;
    if (json['status'] != null) {
      docStatus = VerificationStatus.fromString(json['status'].toString());
    }

    final doc = KycDocument(
      id: json['id'],
      type: docType,
      storageUrl: json['storageUrl'],
      uploadedAt: uploadTime,
      status: docStatus,
      rejectionReason: json['rejectionReason'],
    );
    return doc;
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    if (type != null) 'type': type!.name,
    if (storageUrl != null) 'storageUrl': storageUrl,
    if (uploadedAt != null) 'uploadedAt': uploadedAt!.millisecondsSinceEpoch,
    if (status != null) 'status': status!.toDbString(),
    if (rejectionReason != null) 'rejectionReason': rejectionReason,
  };
}
