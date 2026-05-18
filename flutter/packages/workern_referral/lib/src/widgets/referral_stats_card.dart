import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/referral_config.dart';
import '../providers/referral_providers.dart';

/// Card displaying user's referral statistics
class ReferralStatsCard extends ConsumerWidget {
  final ReferralConfig config;
  final EdgeInsets? padding;

  const ReferralStatsCard({
    super.key,
    required this.config,
    this.padding,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsStream = ref.watch(referralStatsProvider(config));

    return statsStream.when(
      data: (stats) {
        if (stats == null) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Text('No referral data available'),
            ),
          );
        }

        return Card(
          elevation: 2,
          child: Padding(
            padding: padding ?? const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Referral Code',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        stats.referralCode,
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 2,
                                ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () {
                          // Copy to clipboard
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content:
                                  Text('Code copied: ${stats.referralCode}'),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                _StatRow(
                  icon: Icons.people,
                  label: 'Total Referrals',
                  value: stats.totalReferrals.toString(),
                  color: Colors.blue,
                ),
                const SizedBox(height: 8),
                _StatRow(
                  icon: Icons.check_circle,
                  label: 'Successful',
                  value: stats.successfulReferrals.toString(),
                  color: Colors.green,
                ),
                const SizedBox(height: 8),
                _StatRow(
                  icon: Icons.pending,
                  label: 'Pending',
                  value: stats.pendingReferrals.toString(),
                  color: Colors.orange,
                ),
                const SizedBox(height: 8),
                _StatRow(
                  icon: Icons.star,
                  label: 'Rewards Earned',
                  value:
                      '${stats.totalRewardsEarned} ${config.rewardConfig?.rewardCurrency ?? "pts"}',
                  color: Colors.amber,
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (error, stack) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text('Error loading stats: $error'),
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
      ],
    );
  }
}
