import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

part 'referral_reward.freezed.dart';
part 'referral_reward.g.dart';

enum RewardType {
  referralSignup,
  referralPurchase,
  referralBonus,
  custom,
}

enum RewardStatus {
  pending,
  claimed,
  expired,
}

@freezed
class ReferralReward with _$ReferralReward {
  const factory ReferralReward({
    required String id,
    required String userId,
    required RewardType type,
    required int amount,
    required String currency,
    @Default(RewardStatus.pending) RewardStatus status,
    String? referralId,
    String? referredUserId,
    String? description,
    DateTime? createdAt,
    DateTime? claimedAt,
    DateTime? expiresAt,
    Map<String, dynamic>? metadata,
  }) = _ReferralReward;

  factory ReferralReward.fromJson(Map<String, dynamic> json) =>
      _$ReferralRewardFromJson(json);

  factory ReferralReward.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReferralReward(
      id: doc.id,
      userId: data['userId'] ?? '',
      type: RewardType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => RewardType.custom,
      ),
      amount: data['amount'] ?? 0,
      currency: data['currency'] ?? 'credits',
      status: RewardStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => RewardStatus.pending,
      ),
      referralId: data['referralId'],
      referredUserId: data['referredUserId'],
      description: data['description'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
      claimedAt: (data['claimedAt'] as Timestamp?)?.toDate(),
      expiresAt: (data['expiresAt'] as Timestamp?)?.toDate(),
      metadata: data['metadata'] != null
          ? Map<String, dynamic>.from(data['metadata'])
          : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'type': type.name,
      'amount': amount,
      'currency': currency,
      'status': status.name,
      if (referralId != null) 'referralId': referralId,
      if (referredUserId != null) 'referredUserId': referredUserId,
      if (description != null) 'description': description,
      'createdAt': createdAt != null
          ? Timestamp.fromDate(createdAt!)
          : FieldValue.serverTimestamp(),
      if (claimedAt != null) 'claimedAt': Timestamp.fromDate(claimedAt!),
      if (expiresAt != null) 'expiresAt': Timestamp.fromDate(expiresAt!),
      if (metadata != null) 'metadata': metadata,
    };
  }
}
