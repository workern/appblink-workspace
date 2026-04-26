import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/referral_config.dart';
import '../models/referral_data.dart';
import '../models/referral_reward.dart';
import '../services/workern_referral_service.dart';

part 'referral_providers.g.dart';

/// Provider for referral service instance
@riverpod
WorkernReferralService referralService(
    ReferralServiceRef ref, ReferralConfig config) {
  final service = WorkernReferralService(config: config);
  ref.onDispose(() => service.dispose());
  return service;
}

/// Provider for deep link referral data stream
@riverpod
Stream<ReferralData> referralDataStream(
    ReferralDataStreamRef ref, ReferralConfig config) {
  final service = ref.watch(referralServiceProvider(config));
  return service.referralDataStream ?? const Stream.empty();
}

/// Provider for user's referral statistics
@riverpod
Stream<ReferralStats?> referralStats(
    ReferralStatsRef ref, ReferralConfig config) {
  final service = ref.watch(referralServiceProvider(config));
  return service.watchReferralStats();
}

/// Provider for pending rewards
@riverpod
Future<List<ReferralReward>> pendingRewards(
    PendingRewardsRef ref, ReferralConfig config) async {
  final service = ref.watch(referralServiceProvider(config));
  return service.getPendingRewards();
}

/// Provider to generate referral link
@riverpod
Future<String?> generateReferralLink(
  GenerateReferralLinkRef ref,
  ReferralConfig config, {
  String? campaign,
  String? channel,
}) async {
  final service = ref.watch(referralServiceProvider(config));
  return service.generateReferralLink(
    campaign: campaign,
    channel: channel,
  );
}
