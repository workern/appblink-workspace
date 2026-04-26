import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/base.dart';
import 'package:workern_models/amount.dart';
import 'package:workern_utils/workern_utils.dart';

enum SubmissionStatus {
  NOT_APPLIED,
  AWAITING_APPROVAL,
  APPROVED,
  REJECTED,
  IN_PROGRESS,
  SUBMITTED,
  APPROVED_FOR_PAYMENT,
  PAID,
  DISPUTED,
}

enum PaymentStatus { PENDING, PROCESSING, COMPLETED, FAILED }

class ContentLink {
  final String platform;
  final String url;
  final DateTime submittedAt;

  ContentLink({
    required this.platform,
    required this.url,
    required this.submittedAt,
  });

  factory ContentLink.fromJson(Map<String, dynamic> json) {
    return ContentLink(
      platform: json['platform'] ?? '',
      url: json['url'] ?? '',
      submittedAt: parseTimestamp(json['submittedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'platform': platform, 'url': url, 'submittedAt': submittedAt};
  }
}

class SubmissionAnalytics {
  final int clicks;
  final int uniqueClicks;
  final int conversions;
  final Amount earningsGenerated;
  final DateTime lastUpdated;

  SubmissionAnalytics({
    required this.clicks,
    required this.uniqueClicks,
    required this.conversions,
    required this.earningsGenerated,
    required this.lastUpdated,
  });

  factory SubmissionAnalytics.fromJson(Map<String, dynamic> json) {
    return SubmissionAnalytics(
      clicks: json['clicks'] ?? 0,
      uniqueClicks: json['uniqueClicks'] ?? 0,
      conversions: json['conversions'] ?? 0,
      earningsGenerated: Amount.fromJson(json['earningsGenerated'] ?? {}),
      lastUpdated: parseTimestamp(json['lastUpdated']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'clicks': clicks,
      'uniqueClicks': uniqueClicks,
      'conversions': conversions,
      'earningsGenerated': earningsGenerated.toJson(),
      'lastUpdated': lastUpdated,
    };
  }
}

class Submission extends Base {
  // References
  final String campaignId;
  final String campaignTitle;
  final String creatorId;
  final String creatorName;
  final String brandId;
  final String brandName;

  // Status
  final SubmissionStatus status;

  // Application
  final DateTime applicationDate;
  final DateTime? approvalDate;
  final String? rejectionReason;

  // Content
  final List<ContentLink> contentLinks;
  final String? notes;

  // Attribution
  final String? attributionLink;
  final String? attributionLinkId;

  // Analytics
  final SubmissionAnalytics analytics;

  // Payment
  final Amount expectedPayment;
  final Amount? actualPayment;
  final DateTime? paymentDate;
  final PaymentStatus paymentStatus;

  Submission({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.campaignId,
    required this.campaignTitle,
    required this.creatorId,
    required this.creatorName,
    required this.brandId,
    required this.brandName,
    required this.status,
    required this.applicationDate,
    this.approvalDate,
    this.rejectionReason,
    required this.contentLinks,
    this.notes,
    this.attributionLink,
    this.attributionLinkId,
    required this.analytics,
    required this.expectedPayment,
    this.actualPayment,
    this.paymentDate,
    required this.paymentStatus,
  });

  factory Submission.fromJson(Map<String, dynamic> json) {
    return Submission(
      id: json['id'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
      owner: BaseOwner.fromJson(json['owner'] ?? {}),
      space: BaseSpace.fromJson(json['space'] ?? {}),
      campaignId: json['campaignId'] ?? '',
      campaignTitle: json['campaignTitle'] ?? '',
      creatorId: json['creatorId'] ?? '',
      creatorName: json['creatorName'] ?? '',
      brandId: json['brandId'] ?? '',
      brandName: json['brandName'] ?? '',
      status: SubmissionStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => SubmissionStatus.NOT_APPLIED,
      ),
      applicationDate:
          parseTimestamp(json['applicationDate']) ?? DateTime.now(),
      approvalDate: json['approvalDate'] != null
          ? parseTimestamp(json['approvalDate'])
          : null,
      rejectionReason: json['rejectionReason'],
      contentLinks:
          (json['contentLinks'] as List?)
              ?.map((e) => ContentLink.fromJson(e))
              .toList() ??
          [],
      notes: json['notes'],
      attributionLink: json['attributionLink'],
      attributionLinkId: json['attributionLinkId'],
      analytics: SubmissionAnalytics.fromJson(json['analytics'] ?? {}),
      expectedPayment: Amount.fromJson(json['expectedPayment'] ?? {}),
      actualPayment: json['actualPayment'] != null
          ? Amount.fromJson(json['actualPayment'])
          : null,
      paymentDate: json['paymentDate'] != null
          ? parseTimestamp(json['paymentDate'])
          : null,
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['paymentStatus'],
        orElse: () => PaymentStatus.PENDING,
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'owner': owner.toJson(),
      'space': space.toJson(),
      'campaignId': campaignId,
      'campaignTitle': campaignTitle,
      'creatorId': creatorId,
      'creatorName': creatorName,
      'brandId': brandId,
      'brandName': brandName,
      'status': status.name,
      'applicationDate': applicationDate,
      'approvalDate': approvalDate,
      'rejectionReason': rejectionReason,
      'contentLinks': contentLinks.map((e) => e.toJson()).toList(),
      'notes': notes,
      'attributionLink': attributionLink,
      'attributionLinkId': attributionLinkId,
      'analytics': analytics.toJson(),
      'expectedPayment': expectedPayment.toJson(),
      'actualPayment': actualPayment?.toJson(),
      'paymentDate': paymentDate,
      'paymentStatus': paymentStatus.name,
    };
  }
}
