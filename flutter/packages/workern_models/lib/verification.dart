import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import 'kyc_document.dart';
import 'verification_status.dart';

/// Person who handled/verified something
class HandledBy {
  final String uid;
  final String name;
  final String? email;
  final String? mobile;

  HandledBy({required this.uid, required this.name, this.email, this.mobile});

  factory HandledBy.fromJson(Map<String, dynamic> json) {
    return HandledBy(
      uid: json['uid'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      mobile: json['mobile'],
    );
  }

  Map<String, dynamic> toJson() => {
    'uid': uid,
    'name': name,
    if (email != null) 'email': email,
    if (mobile != null) 'mobile': mobile,
  };
}

/// Common Verification model for Items, Shops, and KYC
class Verification {
  final VerificationStatus status;
  final HandledBy? handledBy;
  final DateTime? verifiedAt;
  final DateTime? updatedAt;
  final String? remarks;
  final String? notes;
  final Map<String, KycDocument>? documents;

  Verification({
    required this.status,
    this.handledBy,
    this.verifiedAt,
    this.updatedAt,
    this.remarks,
    this.notes,
    this.documents,
  });

  /// Convenience getter for the timestamp
  DateTime? get timestamp => updatedAt ?? verifiedAt;

  /// Convenience getter for notes/remarks
  String? get message => remarks ?? notes;

  /// Check if status is verified
  bool get isVerified => status == VerificationStatus.verified;

  factory Verification.fromJson(Map<String, dynamic> json) {
    // Accept both 'handledBy' and 'verifiedBy' for backward compatibility
    final handledByData = json['handledBy'] ?? json['verifiedBy'];

    // Handle documents - support both map and legacy array format
    Map<String, KycDocument>? docs;
    if (json['documents'] != null) {
      final documentsData = json['documents'];

      if (documentsData is Map<String, dynamic>) {
        // New map format - check if it's the current structure or legacy
        docs = {};
        documentsData.forEach((key, value) {
          if (value is Map<String, dynamic>) {
            // New format: { 'SHOP_ACT': {...}, 'SHOP_IMAGE': {...} }
            docs![key] = KycDocument.fromJson(value);
          } else if (value is String) {
            // Legacy format: { 'shopAct': 'url', 'shopImage': 'url' }
            final typeMap = {
              'shopAct': KycDocumentType.SHOP_ACT,
              'shopImage': KycDocumentType.SHOP_IMAGE,
              'idProof': KycDocumentType.ID_PROOF,
            };
            if (typeMap.containsKey(key)) {
              docs![typeMap[key]!.name.toUpperCase()] = KycDocument(
                type: typeMap[key]!,
                storageUrl: value,
              );
            }
          }
        });
      } else if (documentsData is List) {
        // Legacy array format - convert to map
        docs = {};
        for (var doc in documentsData) {
          final kycDoc = KycDocument.fromJson(doc);
          final typeName = kycDoc.type?.name.toUpperCase();
          if (typeName != null) {
            docs[typeName] = kycDoc;
          }
        }
      }
    }

    return Verification(
      status: VerificationStatus.fromString(json['status']),
      handledBy: handledByData != null
          ? (handledByData is String
                ? HandledBy(uid: handledByData, name: handledByData)
                : HandledBy.fromJson(handledByData as Map<String, dynamic>))
          : null,
      verifiedAt: parseTimestamp(json['verifiedAt']),
      updatedAt: parseTimestamp(json['updatedAt']),
      remarks: json['remarks'],
      notes: json['notes'],
      documents: docs,
    );
  }

  Map<String, dynamic> toJson() => {
    'status': status.toDbString(),
    if (handledBy != null) 'handledBy': handledBy!.toJson(),
    if (verifiedAt != null) 'verifiedAt': Timestamp.fromDate(verifiedAt!),
    if (updatedAt != null) 'updatedAt': Timestamp.fromDate(updatedAt!),
    if (remarks != null) 'remarks': remarks,
    if (notes != null) 'notes': notes,
    if (documents != null)
      'documents': documents!.map((key, doc) => MapEntry(key, doc.toJson())),
  };

  Verification copyWith({
    VerificationStatus? status,
    HandledBy? handledBy,
    DateTime? verifiedAt,
    DateTime? updatedAt,
    String? remarks,
    String? notes,
    Map<String, KycDocument>? documents,
  }) {
    return Verification(
      status: status ?? this.status,
      handledBy: handledBy ?? this.handledBy,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      remarks: remarks ?? this.remarks,
      notes: notes ?? this.notes,
      documents: documents ?? this.documents,
    );
  }
}
