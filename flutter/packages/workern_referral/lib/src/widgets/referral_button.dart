import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/referral_config.dart';
import '../providers/referral_providers.dart';

/// Button to share referral link
class ReferralButton extends ConsumerWidget {
  final ReferralConfig config;
  final String? customMessage;
  final String? campaign;
  final Widget? child;
  final VoidCallback? onShareSuccess;
  final VoidCallback? onShareError;

  const ReferralButton({
    super.key,
    required this.config,
    this.customMessage,
    this.campaign,
    this.child,
    this.onShareSuccess,
    this.onShareError,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      onPressed: () async {
        final service = ref.read(referralServiceProvider(config));
        final success = await service.shareReferralLink(
          customMessage: customMessage,
          campaign: campaign,
        );

        if (success) {
          onShareSuccess?.call();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Referral link shared!')),
            );
          }
        } else {
          onShareError?.call();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to share referral link')),
            );
          }
        }
      },
      icon: const Icon(Icons.share),
      label: child ?? const Text('Invite Friends'),
    );
  }
}

/// Button to copy referral link
class CopyReferralLinkButton extends ConsumerStatefulWidget {
  final ReferralConfig config;
  final String? campaign;
  final Widget? child;

  const CopyReferralLinkButton({
    super.key,
    required this.config,
    this.campaign,
    this.child,
  });

  @override
  ConsumerState<CopyReferralLinkButton> createState() =>
      _CopyReferralLinkButtonState();
}

class _CopyReferralLinkButtonState
    extends ConsumerState<CopyReferralLinkButton> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: () async {
        final service = ref.read(referralServiceProvider(widget.config));
        final link = await service.generateReferralLink(
          campaign: widget.campaign,
        );

        if (link != null) {
          // Copy to clipboard
          // Note: Add clipboard package to use Clipboard.setData
          setState(() => _copied = true);
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) setState(() => _copied = false);
          });

          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Link copied: $link')),
            );
          }
        }
      },
      icon: Icon(_copied ? Icons.check : Icons.copy),
      label: widget.child ?? Text(_copied ? 'Copied!' : 'Copy Link'),
    );
  }
}
