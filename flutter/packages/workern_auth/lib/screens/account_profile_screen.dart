import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:workern_services/workern_services.dart';
import 'package:workern_widgets/workern_widgets.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';

/// A reusable account/profile screen for all Workern apps.
///
/// Shows the signed-in user's name, email and phone, with
/// Sign Out and Delete Account actions.
///
/// Usage:
/// ```dart
/// AccountProfileScreen(
///   deleteAccountFnName: 'myapp-account-deleteaccount',
///   primaryColor: Colors.blue,
/// )
/// ```
class AccountProfileScreen extends ConsumerStatefulWidget {
  /// The Cloud Function name used to delete the account,
  /// e.g. `'savenest-account-deleteaccount'`
  final String deleteAccountFnName;

  /// The primary brand color used for accents and the app bar.
  final Color primaryColor;

  /// Optional page title (defaults to 'Account')
  final String pageTitle;

  /// Subtitle shown under the 'Delete Account' row.
  /// Use this to clarify scope, e.g. 'Permanently delete your Save Nest data'
  final String deleteAccountSubtitle;

  /// Body text shown in the confirmation dialog before the user confirms deletion.
  final String deleteAccountConfirmMessage;

  /// Whether the user currently has an active subscription.
  /// When non-null, a "Subscription" section is shown.
  final bool? isSubscribed;

  /// Called when the user taps "Upgrade to Pro". Show your paywall here.
  final VoidCallback? onUpgradeTapped;

  /// Called when a subscribed user taps "Manage Subscription".
  final VoidCallback? onManageSubscriptionTapped;

  /// If provided, a tappable "Privacy Policy" link is shown.
  final String? privacyPolicyUrl;

  /// If provided, a tappable "Terms of Use" link is shown.
  final String? termsUrl;

  /// Optional override for the app bar background color.
  /// If omitted, falls back to [primaryColor].
  final Color? appBarColor;

  /// Optional override for the app bar foreground (title/icon) color.
  final Color? appBarForegroundColor;

  /// When true, the app bar uses glassmorphism and the body extends behind it.
  final bool useGlass;

  const AccountProfileScreen({
    super.key,
    required this.deleteAccountFnName,
    required this.primaryColor,
    this.pageTitle = 'Account',
    this.deleteAccountSubtitle = 'Permanently delete your account and all data',
    this.deleteAccountConfirmMessage =
        'This will permanently delete your account and all saved data. '
        'This action cannot be undone.',
    this.isSubscribed,
    this.onUpgradeTapped,
    this.onManageSubscriptionTapped,
    this.privacyPolicyUrl,
    this.termsUrl,
    this.appBarColor,
    this.appBarForegroundColor,
    this.useGlass = false,
  });

  @override
  ConsumerState<AccountProfileScreen> createState() =>
      _AccountProfileScreenState();
}

class _AccountProfileScreenState extends ConsumerState<AccountProfileScreen> {
  final _functionsService = CloudFunctionsService();

  Future<void> _deleteAccount() async {
    await showAdaptiveConfirmationDialog(
      context: context,
      title: 'Delete Account',
      message: widget.deleteAccountConfirmMessage,
      confirmLabel: 'Delete Account',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: () async {
        try {
          await _functionsService.call(widget.deleteAccountFnName, {
            'acknowledged': true,
          });
          await ref.read(authServiceProvider).signOut();
        } catch (e) {
          if (mounted) {
            ShadToaster.of(context).show(
              ShadToast.destructive(
                title: const Text('Error'),
                description: Text('Failed to delete account: $e'),
              ),
            );
          }
          rethrow;
        }
      },
    );
  }

  Future<void> _signOut() async {
    if (!mounted) return;
    await showAdaptiveConfirmationDialog(
      context: context,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: () async {
        final authService = ref.read(authServiceProvider);
        await authService.signOut();
      },
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ShadToaster.of(context).show(
          ShadToast.destructive(
            title: const Text('Error'),
            description: const Text('Could not open link'),
          ),
        );
      }
    }
  }

  Widget _buildSubscriptionSection(ShadThemeData theme) {
    final subscribed = widget.isSubscribed ?? false;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SUBSCRIPTION',
          style: theme.textTheme.muted.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        ShadCard(
          padding: const EdgeInsets.all(16),
          child: subscribed ? _buildProCard(theme) : _buildFreeCard(theme),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildProCard(ShadThemeData theme) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                widget.primaryColor,
                widget.primaryColor.withValues(alpha: 0.7),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.star_rounded, size: 14, color: Colors.white),
              const SizedBox(width: 4),
              Text(
                'PRO',
                style: theme.textTheme.small.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pro Plan',
                style: theme.textTheme.p.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.foreground,
                ),
              ),
              Text(
                'Unlimited saves & AI searches',
                style: theme.textTheme.muted.copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
        if (widget.onManageSubscriptionTapped != null)
          ShadButton.ghost(
            onPressed: widget.onManageSubscriptionTapped,
            size: ShadButtonSize.sm,
            child: const Text('Manage'),
          ),
      ],
    );
  }

  Widget _buildFreeCard(ShadThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.muted,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'FREE',
                style: theme.textTheme.small.copyWith(
                  color: theme.colorScheme.mutedForeground,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Free Plan',
                    style: theme.textTheme.p.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.foreground,
                    ),
                  ),
                  Text(
                    'Limited saves & searches',
                    style: theme.textTheme.muted.copyWith(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (widget.onUpgradeTapped != null) ...[
          const SizedBox(height: 12),
          ShadButton(
            width: double.infinity,
            onPressed: widget.onUpgradeTapped,
            backgroundColor: widget.primaryColor,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star_rounded, size: 16, color: Colors.white),
                const SizedBox(width: 6),
                const Text('Upgrade to Pro'),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLegalSection(ShadThemeData theme) {
    final hasLinks = widget.privacyPolicyUrl != null || widget.termsUrl != null;
    if (!hasLinks) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text(
          'LEGAL',
          style: theme.textTheme.muted.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        ShadCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              if (widget.privacyPolicyUrl != null)
                _buildLegalRow(
                  theme,
                  icon: Icons.privacy_tip_outlined,
                  label: 'Privacy Policy',
                  url: widget.privacyPolicyUrl!,
                  showDivider: widget.termsUrl != null,
                ),
              if (widget.termsUrl != null)
                _buildLegalRow(
                  theme,
                  icon: Icons.description_outlined,
                  label: 'Terms of Use',
                  url: widget.termsUrl!,
                  showDivider: false,
                ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildLegalRow(
    ShadThemeData theme, {
    required IconData icon,
    required String label,
    required String url,
    required bool showDivider,
  }) {
    return Column(
      children: [
        InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => _launchUrl(url),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(icon, size: 18, color: theme.colorScheme.mutedForeground),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: theme.textTheme.p.copyWith(
                      color: theme.colorScheme.foreground,
                    ),
                  ),
                ),
                Icon(
                  Icons.open_in_new,
                  size: 16,
                  color: theme.colorScheme.mutedForeground,
                ),
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            indent: 16,
            endIndent: 16,
            color: theme.colorScheme.border,
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(firebaseUserProvider);
    final theme = ShadTheme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: widget.useGlass,
      appBar: WorkernAppBar(
        title: widget.pageTitle,
        themeColor: widget.useGlass
            ? Colors.transparent
            : (widget.appBarColor ?? widget.primaryColor),
        foregroundColor: widget.useGlass
            ? null
            : (widget.appBarForegroundColor ?? Colors.white),
        useGlass: widget.useGlass,
        showAuthAction: false,
        showNotifications: false,
        showBackButton: true,
        elevation: 0,
      ),
      body: Stack(
        children: [
          if (widget.useGlass) const WorkernAmbientBackground(),
          ListView(
            padding: EdgeInsets.only(
              top: widget.useGlass
                  ? MediaQuery.of(context).padding.top + kToolbarHeight + 8
                  : 16,
              left: 16,
              right: 16,
              bottom: MediaQuery.of(context).padding.bottom + 16,
            ),
            children: [
              if (user != null) ...[
                ShadCard(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: widget.primaryColor.withValues(
                          alpha: 0.1,
                        ),
                        backgroundImage: user.photoURL != null
                            ? NetworkImage(user.photoURL!)
                            : null,
                        onBackgroundImageError: user.photoURL != null
                            ? (_, __) {}
                            : null,
                        child: user.photoURL == null
                            ? Icon(
                                Icons.person,
                                size: 32,
                                color: widget.primaryColor,
                              )
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (user.displayName != null)
                              Text(
                                user.displayName!,
                                style: theme.textTheme.h4.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: theme.colorScheme.foreground,
                                ),
                              ),
                            if (user.email != null)
                              Text(user.email!, style: theme.textTheme.muted),
                            if (user.phoneNumber != null)
                              Text(
                                user.phoneNumber!,
                                style: theme.textTheme.muted,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Subscription section (shown only when isSubscribed is provided)
              if (widget.isSubscribed != null) _buildSubscriptionSection(theme),

              // Legal section
              _buildLegalSection(theme),

              Text(
                'ACCOUNT',
                style: theme.textTheme.muted.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 8),
              ShadCard(
                padding: EdgeInsets.zero,
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: _signOut,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.logout,
                          size: 18,
                          color: theme.colorScheme.foreground,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Sign Out',
                            style: theme.textTheme.p.copyWith(
                              color: theme.colorScheme.foreground,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          size: 18,
                          color: theme.colorScheme.mutedForeground,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              Text(
                'DANGER ZONE',
                style: theme.textTheme.muted.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                  color: theme.colorScheme.destructive.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 8),
              ShadCard(
                padding: EdgeInsets.zero,
                border: ShadBorder.all(
                  color: theme.colorScheme.destructive.withValues(alpha: 0.3),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: _deleteAccount,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.delete_forever_outlined,
                          size: 18,
                          color: theme.colorScheme.destructive,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Delete Account',
                                style: theme.textTheme.p.copyWith(
                                  color: theme.colorScheme.destructive,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                widget.deleteAccountSubtitle,
                                style: theme.textTheme.muted.copyWith(
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          size: 18,
                          color: theme.colorScheme.mutedForeground,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
