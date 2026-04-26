import 'package:freezed_annotation/freezed_annotation.dart';

part 'referral_config.freezed.dart';
part 'referral_config.g.dart';

/// Configuration for Branch SDK and referral system
@freezed
class ReferralConfig with _$ReferralConfig {
  const factory ReferralConfig({
    required String branchKey,
    required String appName,
    required String appId,
    @Default(true) bool enableLogging,
    @Default(false) bool useTestInstance,
    String? logoUrl,
    String? deepLinkDomain,

    // Referral rewards configuration
    ReferralRewardConfig? rewardConfig,
  }) = _ReferralConfig;

  factory ReferralConfig.fromJson(Map<String, dynamic> json) =>
      _$ReferralConfigFromJson(json);
}

@freezed
class ReferralRewardConfig with _$ReferralRewardConfig {
  const factory ReferralRewardConfig({
    /// Reward for the referrer when someone signs up
    @Default(100) int referrerSignupReward,

    /// Reward for the referee when they sign up
    @Default(50) int refereeSignupReward,

    /// Reward for referrer when referee makes first purchase
    int? referrerPurchaseReward,

    /// Currency/unit (e.g., "credits", "points", "₹")
    @Default('credits') String rewardCurrency,

    /// Minimum referrals needed for bonus
    int? bonusThreshold,

    /// Bonus reward when threshold is reached
    int? bonusReward,
  }) = _ReferralRewardConfig;

  factory ReferralRewardConfig.fromJson(Map<String, dynamic> json) =>
      _$ReferralRewardConfigFromJson(json);
}
