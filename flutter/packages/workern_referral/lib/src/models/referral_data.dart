import 'package:cloud_firestore/cloud_firestore.dart';

/// Referral data from Branch deep link
class ReferralData {
  final String? referrerId;
  final String? referrerName;
  final String? referralCode;
  final String? campaign;
  final String? channel;
  final String? feature;
  final Map<String, dynamic>? customData;
  final bool clickedBranchLink;
  final bool isFirstSession;

  const ReferralData({
    this.referrerId,
    this.referrerName,
    this.referralCode,
    this.campaign,
    this.channel,
    this.feature,
    this.customData,
    this.clickedBranchLink = false,
    this.isFirstSession = false,
  });

  factory ReferralData.fromJson(Map<String, dynamic> json) => ReferralData(
        referrerId: json['referrerId'] as String?,
        referrerName: json['referrerName'] as String?,
        referralCode: json['referralCode'] as String?,
        campaign: json['campaign'] as String?,
        channel: json['channel'] as String?,
        feature: json['feature'] as String?,
        customData: json['customData'] as Map<String, dynamic>?,
        clickedBranchLink: json['clickedBranchLink'] as bool? ?? false,
        isFirstSession: json['isFirstSession'] as bool? ?? false,
      );

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

  Map<String, dynamic> toJson() => {
        'referrerId': referrerId,
        'referrerName': referrerName,
        'referralCode': referralCode,
        'campaign': campaign,
        'channel': channel,
        'feature': feature,
        'customData': customData,
        'clickedBranchLink': clickedBranchLink,
        'isFirstSession': isFirstSession,
      };

  ReferralData copyWith({
    String? referrerId,
    String? referrerName,
    String? referralCode,
    String? campaign,
    String? channel,
    String? feature,
    Map<String, dynamic>? customData,
    bool? clickedBranchLink,
    bool? isFirstSession,
  }) =>
      ReferralData(
        referrerId: referrerId ?? this.referrerId,
        referrerName: referrerName ?? this.referrerName,
        referralCode: referralCode ?? this.referralCode,
        campaign: campaign ?? this.campaign,
        channel: channel ?? this.channel,
        feature: feature ?? this.feature,
        customData: customData ?? this.customData,
        clickedBranchLink: clickedBranchLink ?? this.clickedBranchLink,
        isFirstSession: isFirstSession ?? this.isFirstSession,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReferralData &&
          runtimeType == other.runtimeType &&
          referrerId == other.referrerId &&
          referrerName == other.referrerName &&
          referralCode == other.referralCode &&
          campaign == other.campaign &&
          channel == other.channel &&
          feature == other.feature &&
          clickedBranchLink == other.clickedBranchLink &&
          isFirstSession == other.isFirstSession;

  @override
  int get hashCode => Object.hash(referrerId, referrerName, referralCode,
      campaign, channel, feature, clickedBranchLink, isFirstSession);

  @override
  String toString() =>
      'ReferralData(referrerId: $referrerId, referrerName: $referrerName, referralCode: $referralCode, campaign: $campaign, channel: $channel, feature: $feature, clickedBranchLink: $clickedBranchLink, isFirstSession: $isFirstSession)';
}

/// User's referral statistics
class ReferralStats {
  final String userId;
  final String referralCode;
  final int totalReferrals;
  final int successfulReferrals;
  final int pendingReferrals;
  final int totalRewardsEarned;
  final List<String> referredUserIds;
  final DateTime? createdAt;
  final DateTime? lastUpdated;

  const ReferralStats({
    required this.userId,
    required this.referralCode,
    this.totalReferrals = 0,
    this.successfulReferrals = 0,
    this.pendingReferrals = 0,
    this.totalRewardsEarned = 0,
    this.referredUserIds = const [],
    this.createdAt,
    this.lastUpdated,
  });

  factory ReferralStats.fromJson(Map<String, dynamic> json) => ReferralStats(
        userId: json['userId'] as String,
        referralCode: json['referralCode'] as String,
        totalReferrals: json['totalReferrals'] as int? ?? 0,
        successfulReferrals: json['successfulReferrals'] as int? ?? 0,
        pendingReferrals: json['pendingReferrals'] as int? ?? 0,
        totalRewardsEarned: json['totalRewardsEarned'] as int? ?? 0,
        referredUserIds:
            (json['referredUserIds'] as List<dynamic>?)?.cast<String>() ?? [],
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
        lastUpdated: json['lastUpdated'] != null
            ? DateTime.parse(json['lastUpdated'] as String)
            : null,
      );

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

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'referralCode': referralCode,
        'totalReferrals': totalReferrals,
        'successfulReferrals': successfulReferrals,
        'pendingReferrals': pendingReferrals,
        'totalRewardsEarned': totalRewardsEarned,
        'referredUserIds': referredUserIds,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (lastUpdated != null) 'lastUpdated': lastUpdated!.toIso8601String(),
      };

  ReferralStats copyWith({
    String? userId,
    String? referralCode,
    int? totalReferrals,
    int? successfulReferrals,
    int? pendingReferrals,
    int? totalRewardsEarned,
    List<String>? referredUserIds,
    DateTime? createdAt,
    DateTime? lastUpdated,
  }) =>
      ReferralStats(
        userId: userId ?? this.userId,
        referralCode: referralCode ?? this.referralCode,
        totalReferrals: totalReferrals ?? this.totalReferrals,
        successfulReferrals: successfulReferrals ?? this.successfulReferrals,
        pendingReferrals: pendingReferrals ?? this.pendingReferrals,
        totalRewardsEarned: totalRewardsEarned ?? this.totalRewardsEarned,
        referredUserIds: referredUserIds ?? this.referredUserIds,
        createdAt: createdAt ?? this.createdAt,
        lastUpdated: lastUpdated ?? this.lastUpdated,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReferralStats &&
          runtimeType == other.runtimeType &&
          userId == other.userId &&
          referralCode == other.referralCode &&
          totalReferrals == other.totalReferrals &&
          successfulReferrals == other.successfulReferrals &&
          pendingReferrals == other.pendingReferrals &&
          totalRewardsEarned == other.totalRewardsEarned;

  @override
  int get hashCode => Object.hash(userId, referralCode, totalReferrals,
      successfulReferrals, pendingReferrals, totalRewardsEarned);

  @override
  String toString() =>
      'ReferralStats(userId: $userId, referralCode: $referralCode, totalReferrals: $totalReferrals, successfulReferrals: $successfulReferrals, pendingReferrals: $pendingReferrals)';
}

