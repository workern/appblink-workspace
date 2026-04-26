import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

part 'referral_data.freezed.dart';
part 'referral_data.g.dart';

/// Referral data from Branch deep link
@freezed
class ReferralData with _$ReferralData {
  const factory ReferralData({
    String? referrerId,
    String? referrerName,
    String? referralCode,
    String? campaign,
    String? channel,
    String? feature,
    Map<String, dynamic>? customData,
    @Default(false) bool clickedBranchLink,
    @Default(false) bool isFirstSession,
  }) = _ReferralData;

  factory ReferralData.fromJson(Map<String, dynamic> json) =>
      _$ReferralDataFromJson(json);

  factory ReferralData.fromBranchData(Map<dynamic, dynamic> branchData) {
    return ReferralData(
      referrerId: branchData['referrer_id']?.toString(),
      referrerName: branchData['referrer_name']?.toString(),
      referralCode: branchData['referral_code']?.toString(),
      campaign: branchData['~campaign']?.toString(),
      channel: branchData['~channel']?.toString(),
      feature: branchData['~feature']?.toString(),
      clickedBranchLink: branchData['+clicked_branch_link'] == true,
      isFirstSession: branchData['+is_first_session'] == true,
      customData: Map<String, dynamic>.from(branchData),
    );
  }
}

/// User's referral statistics
@freezed
class ReferralStats with _$ReferralStats {
  const factory ReferralStats({
    required String userId,
    required String referralCode,
    @Default(0) int totalReferrals,
    @Default(0) int successfulReferrals,
    @Default(0) int pendingReferrals,
    @Default(0) int totalRewardsEarned,
    @Default([]) List<String> referredUserIds,
    DateTime? createdAt,
    DateTime? lastUpdated,
  }) = _ReferralStats;

  factory ReferralStats.fromJson(Map<String, dynamic> json) =>
      _$ReferralStatsFromJson(json);

  factory ReferralStats.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReferralStats(
      userId: doc.id,
      referralCode: data['referralCode'] ?? '',
      totalReferrals: data['totalReferrals'] ?? 0,
      successfulReferrals: data['successfulReferrals'] ?? 0,
      pendingReferrals: data['pendingReferrals'] ?? 0,
      totalRewardsEarned: data['totalRewardsEarned'] ?? 0,
      referredUserIds: List<String>.from(data['referredUserIds'] ?? []),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
      lastUpdated: (data['lastUpdated'] as Timestamp?)?.toDate(),
    );
  }
}
