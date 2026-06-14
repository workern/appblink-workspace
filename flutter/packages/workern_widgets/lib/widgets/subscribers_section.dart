import 'package:flutter/material.dart';
import 'package:workern_models/workern_models.dart';

/// A reusable widget that displays a shop's subscriber audience.
///
/// Designed to be embedded in any app's communication screen.
/// Accepts data via callbacks — no provider dependency, fully portable.
///
/// Usage:
/// ```dart
/// SubscribersSection(
///   subscribers: ref.watch(subscribersProvider).value ?? [],
///   isLoading: ref.watch(shopSubscribersProvider).isLoading,
///   consentOnly: ref.watch(subscriberFilterConsentOnlyProvider),
///   onConsentFilterChanged: (v) => ref.read(subscriberFilterConsentOnlyProvider.notifier).state = v,
/// )
/// ```
class SubscribersSection extends StatelessWidget {
  final List<CommunicationSubscriber> subscribers;
  final bool isLoading;
  final bool consentOnly;
  final int totalCount;
  final int consentedCount;
  final ValueChanged<bool>? onConsentFilterChanged;
  final void Function(CommunicationSubscriber subscriber)? onSubscriberTapped;

  const SubscribersSection({
    super.key,
    required this.subscribers,
    this.isLoading = false,
    this.consentOnly = false,
    this.totalCount = 0,
    this.consentedCount = 0,
    this.onConsentFilterChanged,
    this.onSubscriberTapped,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header ────────────────────────────────────────────────────
        _SubscriberHeader(
          totalCount: totalCount,
          consentedCount: consentedCount,
          consentOnly: consentOnly,
          onConsentFilterChanged: onConsentFilterChanged,
        ),
        const SizedBox(height: 12),

        // ── Consent info banner ───────────────────────────────────────
        if (consentedCount < totalCount && !consentOnly)
          _ConsentBanner(
            consentedCount: consentedCount,
            totalCount: totalCount,
            onFilterTap: () => onConsentFilterChanged?.call(true),
          ),
        if (consentedCount < totalCount && !consentOnly)
          const SizedBox(height: 12),

        // ── List ──────────────────────────────────────────────────────
        if (isLoading)
          _SubscriberSkeleton()
        else if (subscribers.isEmpty)
          _EmptySubscribers(consentOnly: consentOnly)
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: subscribers.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) => _SubscriberTile(
              subscriber: subscribers[i],
              onTap: onSubscriberTapped,
            ),
          ),
      ],
    );
  }
}

// ── Header ─────────────────────────────────────────────────────────────────────

class _SubscriberHeader extends StatelessWidget {
  final int totalCount;
  final int consentedCount;
  final bool consentOnly;
  final ValueChanged<bool>? onConsentFilterChanged;

  const _SubscriberHeader({
    required this.totalCount,
    required this.consentedCount,
    required this.consentOnly,
    this.onConsentFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Audience',
                style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),
              Text(
                '$totalCount total · $consentedCount can receive campaigns',
                style: tt.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        // Toggle filter chip
        FilterChip(
          label: Text(
            'Opted-in only',
            style: tt.labelSmall,
          ),
          selected: consentOnly,
          onSelected: onConsentFilterChanged,
          selectedColor: cs.primaryContainer,
          checkmarkColor: cs.primary,
          side: BorderSide(
            color: consentOnly ? cs.primary : cs.outlineVariant,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 4),
        ),
      ],
    );
  }
}

// ── Consent banner ─────────────────────────────────────────────────────────────

class _ConsentBanner extends StatelessWidget {
  final int consentedCount;
  final int totalCount;
  final VoidCallback? onFilterTap;

  const _ConsentBanner({
    required this.consentedCount,
    required this.totalCount,
    this.onFilterTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final notConsented = totalCount - consentedCount;

    return GestureDetector(
      onTap: onFilterTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: cs.secondaryContainer.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Row(
          children: [
            Icon(
              Icons.info_outline_rounded,
              size: 16,
              color: cs.secondary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '$notConsented subscriber${notConsented == 1 ? " hasn\'t" : "s haven\'t"} opted-in to campaigns. '
                'Only $consentedCount can be messaged.',
                style: tt.bodySmall?.copyWith(color: cs.onSecondaryContainer),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Subscriber tile ────────────────────────────────────────────────────────────

class _SubscriberTile extends StatelessWidget {
  final CommunicationSubscriber subscriber;
  final void Function(CommunicationSubscriber subscriber)? onTap;

  const _SubscriberTile({
    required this.subscriber,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    final initials = _initials(subscriber.displayName);
    final sourceLabel = subscriber.source == CommunicationSubscriberSource.EXPLICIT
        ? 'Subscribed'
        : 'Ordered';
    final sourceColor = subscriber.source == CommunicationSubscriberSource.EXPLICIT
        ? cs.primary
        : cs.tertiary;

    return InkWell(
      onTap: onTap != null ? () => onTap!(subscriber) : null,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: cs.primaryContainer,
              child: Text(
                initials,
                style: tt.labelMedium?.copyWith(
                  color: cs.onPrimaryContainer,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Name + phone
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subscriber.displayName,
                    style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (subscriber.phone != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      subscriber.phone!,
                      style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Source chip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: sourceColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                sourceLabel,
                style: tt.labelSmall?.copyWith(
                  color: sourceColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 6),
            // Consent badge
            Icon(
              subscriber.consentGiven
                  ? Icons.check_circle_rounded
                  : Icons.radio_button_unchecked_rounded,
              size: 18,
              color: subscriber.consentGiven
                  ? Colors.green.shade600
                  : cs.outlineVariant,
            ),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}

// ── Empty state ────────────────────────────────────────────────────────────────

class _EmptySubscribers extends StatelessWidget {
  final bool consentOnly;
  const _EmptySubscribers({required this.consentOnly});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: Column(
          children: [
            Icon(
              consentOnly
                  ? Icons.check_circle_outline_rounded
                  : Icons.people_outline_rounded,
              size: 40,
              color: cs.outlineVariant,
            ),
            const SizedBox(height: 12),
            Text(
              consentOnly
                  ? 'No opted-in subscribers yet'
                  : 'No subscribers yet',
              style: tt.titleSmall?.copyWith(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            Text(
              consentOnly
                  ? 'Subscribers appear here once customers opt-in via the Nikat app.'
                  : 'Customers who order or subscribe appear here automatically.',
              style: tt.bodySmall
                  ?.copyWith(color: cs.onSurfaceVariant.withValues(alpha: 0.7)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skeleton loader ─────────────────────────────────────────────────────────────

class _SubscriberSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        5,
        (_) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 13,
                      width: 140,
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Container(
                      height: 11,
                      width: 90,
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
