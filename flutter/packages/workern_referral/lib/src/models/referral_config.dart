/// Configuration for Branch SDK and referral system
class ReferralConfig {
  final String branchKey;
  final String appName;
  final String appId;
  final bool enableLogging;
  final bool useTestInstance;
  final String? logoUrl;
  final String? deepLinkDomain;
  final ReferralRewardConfig? rewardConfig;

  const ReferralConfig({
    required this.branchKey,
    required this.appName,
    required this.appId,
    this.enableLogging = true,
    this.useTestInstance = false,
    this.logoUrl,
    this.deepLinkDomain,
    this.rewardConfig,
  });

  factory ReferralConfig.fromJson(Map<String, dynamic> json) => ReferralConfig(
        branchKey: json['branchKey'] as String,
        appName: json['appName'] as String,
        appId: json['appId'] as String,
        enableLogging: json['enableLogging'] as bool? ?? true,
        useTestInstance: json['useTestInstance'] as bool? ?? false,
        logoUrl: json['logoUrl'] as String?,
        deepLinkDomain: json['deepLinkDomain'] as String?,
        rewardConfig: json['rewardConfig'] != null
            ? ReferralRewardConfig.fromJson(
                json['rewardConfig'] as Map<String, dynamic>)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'branchKey': branchKey,
        'appName': appName,
        'appId': appId,
        'enableLogging': enableLogging,
        'useTestInstance': useTestInstance,
        if (logoUrl != null) 'logoUrl': logoUrl,
        if (deepLinkDomain != null) 'deepLinkDomain': deepLinkDomain,
        if (rewardConfig != null) 'rewardConfig': rewardConfig!.toJson(),
      };

  ReferralConfig copyWith({
    String? branchKey,
    String? appName,
    String? appId,
    bool? enableLogging,
    bool? useTestInstance,
    String? logoUrl,
    String? deepLinkDomain,
    ReferralRewardConfig? rewardConfig,
  }) =>
      ReferralConfig(
        branchKey: branchKey ?? this.branchKey,
        appName: appName ?? this.appName,
        appId: appId ?? this.appId,
        enableLogging: enableLogging ?? this.enableLogging,
        useTestInstance: useTestInstance ?? this.useTestInstance,
        logoUrl: logoUrl ?? this.logoUrl,
        deepLinkDomain: deepLinkDomain ?? this.deepLinkDomain,
        rewardConfig: rewardConfig ?? this.rewardConfig,
      );
}

class ReferralRewardConfig {
  /// Reward for the referrer when someone signs up
  final int referrerSignupReward;

  /// Reward for the referee when they sign up
  final int refereeSignupReward;

  /// Reward for referrer when referee makes first purchase
  final int? referrerPurchaseReward;

  /// Currency/unit (e.g., "credits", "points", "₹")
  final String rewardCurrency;

  /// Minimum referrals needed for bonus
  final int? bonusThreshold;

  /// Bonus reward when threshold is reached
  final int? bonusReward;

  const ReferralRewardConfig({
    this.referrerSignupReward = 100,
    this.refereeSignupReward = 50,
    this.referrerPurchaseReward,
    this.rewardCurrency = 'credits',
    this.bonusThreshold,
    this.bonusReward,
  });

  factory ReferralRewardConfig.fromJson(Map<String, dynamic> json) =>
      ReferralRewardConfig(
        referrerSignupReward: json['referrerSignupReward'] as int? ?? 100,
        refereeSignupReward: json['refereeSignupReward'] as int? ?? 50,
        referrerPurchaseReward: json['referrerPurchaseReward'] as int?,
        rewardCurrency: json['rewardCurrency'] as String? ?? 'credits',
        bonusThreshold: json['bonusThreshold'] as int?,
        bonusReward: json['bonusReward'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'referrerSignupReward': referrerSignupReward,
        'refereeSignupReward': refereeSignupReward,
        if (referrerPurchaseReward != null)
          'referrerPurchaseReward': referrerPurchaseReward,
        'rewardCurrency': rewardCurrency,
        if (bonusThreshold != null) 'bonusThreshold': bonusThreshold,
        if (bonusReward != null) 'bonusReward': bonusReward,
      };

  ReferralRewardConfig copyWith({
    int? referrerSignupReward,
    int? refereeSignupReward,
    int? referrerPurchaseReward,
    String? rewardCurrency,
    int? bonusThreshold,
    int? bonusReward,
  }) =>
      ReferralRewardConfig(
        referrerSignupReward: referrerSignupReward ?? this.referrerSignupReward,
        refereeSignupReward: refereeSignupReward ?? this.refereeSignupReward,
        referrerPurchaseReward:
            referrerPurchaseReward ?? this.referrerPurchaseReward,
        rewardCurrency: rewardCurrency ?? this.rewardCurrency,
        bonusThreshold: bonusThreshold ?? this.bonusThreshold,
        bonusReward: bonusReward ?? this.bonusReward,
      );
}

