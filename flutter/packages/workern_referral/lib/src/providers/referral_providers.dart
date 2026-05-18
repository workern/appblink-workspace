import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/referral_config.dart';
import '../models/referral_data.dart';
import '../models/referral_reward.dart';
import '../services/workern_referral_service.dart';

/// Provider for referral service instance
final referralServiceProvider =
    Provider.family<WorkernReferralService, ReferralConfig>((ref, config) {
  final service = WorkernReferralService(config: config);
  ref.onDispose(() => service.dispose());
  return service;
});

/// Provider for deep link referral data stream
final referralDataStreamProvider =
    StreamProvider.family<ReferralData, ReferralConfig>((ref, config) {
  final service = ref.watch(referralServiceProvider(config));
  return service.referralDataStream ?? const Stream.empty();
});

/// Provider for user's referral statistics
final referralStatsProvider =
    StreamProvider.family<ReferralStats?, ReferralConfig>((ref, config) {
  final service = ref.watch(referralServiceProvider(config));
  return service.watchReferralStats();
});

/// Provider for pending rewards
final pendingRewardsProvider =
    FutureProvider.family<List<ReferralReward>, ReferralConfig>(
        (ref, config) async {
  final service = ref.watch(referralServiceProvider(config));
  return service.getPendingRewards();
});

/// Provider to generate referral link.
/// Wrap args in a record since family only accepts one parameter.
final generateReferralLinkProvider = FutureProvider.family<String?,
    ({ReferralConfig config, String? campaign, String? channel})>(
  (ref, args) async {
    final service = ref.watch(referralServiceProvider(args.config));
    return service.generateReferralLink(
      campaign: args.campaign,
      channel: args.channel,
    );
  },
);
