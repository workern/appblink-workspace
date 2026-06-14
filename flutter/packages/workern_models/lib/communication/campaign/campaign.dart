import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../../common/base.dart';

/// The channel used to deliver the campaign.
enum CampaignChannel { WHATSAPP, SMS, EMAIL, NOTIFICATION }

CampaignChannel campaignChannelFromString(String value) {
  return CampaignChannel.values.firstWhere(
    (e) => e.name == value,
    orElse: () => CampaignChannel.WHATSAPP,
  );
}

/// Lifecycle status of a broadcast campaign.
enum CampaignStatus { DRAFT, SENDING, COMPLETED, FAILED, PARTIAL }

CampaignStatus campaignStatusFromString(String value) {
  return CampaignStatus.values.firstWhere(
    (e) => e.name == value,
    orElse: () => CampaignStatus.DRAFT,
  );
}

/// A broadcast campaign sent by a shop owner to opted-in subscribers.
///
/// Stored at:
///   apps/nikat-shop-manager/workspaces/{shopId}/campaigns/{campaignId}
class Campaign extends Base {
  /// The workspace / shop this campaign belongs to.
  final String shopId;

  /// Human-readable campaign name / title.
  final String name;

  /// The message body sent to each recipient.
  final String message;

  /// Channel through which the message was delivered.
  final CampaignChannel channel;

  /// Current lifecycle status.
  final CampaignStatus status;

  /// Total number of subscribers targeted.
  final int totalTargets;

  /// Number successfully delivered.
  final int successCount;

  /// Number that failed.
  final int failCount;

  /// Optional map of errors: subscriberId → error message.
  final Map<String, String> errors;

  /// When the campaign dispatch completed (null if still sending).
  final DateTime? completedAt;

  Campaign({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    super.owner,
    super.space,
    required this.shopId,
    required this.name,
    required this.message,
    required this.channel,
    required this.status,
    required this.totalTargets,
    required this.successCount,
    required this.failCount,
    this.errors = const {},
    this.completedAt,
  });

  factory Campaign.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);

    final rawErrors = json['errors'];
    Map<String, String> errors = {};
    if (rawErrors is Map) {
      rawErrors.forEach((k, v) => errors[k.toString()] = v.toString());
    }

    DateTime? completedAt;
    if (json['completedAt'] is Timestamp) {
      completedAt = (json['completedAt'] as Timestamp).toDate();
    } else if (json['completedAt'] != null) {
      completedAt = parseTimestamp(json['completedAt']);
    }

    return Campaign(
      id: base['id'] as String,
      createdAt: base['createdAt'] as DateTime,
      updatedAt: base['updatedAt'] as DateTime,
      owner: base['owner'] as BaseOwner?,
      space: base['space'] as BaseSpace?,
      shopId: json['shopId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      message: json['message'] as String? ?? '',
      channel: campaignChannelFromString(json['channel'] as String? ?? ''),
      status: campaignStatusFromString(json['status'] as String? ?? ''),
      totalTargets: (json['totalTargets'] as num?)?.toInt() ?? 0,
      successCount: (json['successCount'] as num?)?.toInt() ?? 0,
      failCount: (json['failCount'] as num?)?.toInt() ?? 0,
      errors: errors,
      completedAt: completedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'shopId': shopId,
        'name': name,
        'message': message,
        'channel': channel.name,
        'status': status.name,
        'totalTargets': totalTargets,
        'successCount': successCount,
        'failCount': failCount,
        'errors': errors,
        if (completedAt != null)
          'completedAt': Timestamp.fromDate(completedAt!),
        if (owner != null) 'owner': owner!.toJson(),
        if (space != null) 'space': space!.toJson(),
      };

  /// Delivery rate as a percentage (0–100).
  double get deliveryRate =>
      totalTargets > 0 ? (successCount / totalTargets) * 100 : 0.0;

  /// Whether this campaign has finished processing.
  bool get isFinished =>
      status == CampaignStatus.COMPLETED ||
      status == CampaignStatus.FAILED ||
      status == CampaignStatus.PARTIAL;
}
