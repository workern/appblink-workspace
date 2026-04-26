import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_tokens.dart';
import 'widgets/home_search_bar.dart';
import 'widgets/example_save_card.dart';

// ---------------------------------------------------------------------------
// Home Tab Content
// ---------------------------------------------------------------------------

/// Home tab body — rendered inside [AppShell].
/// Must NOT include its own [Scaffold] or [AppBar].
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => const HomeTabContent();
}

class HomeTabContent extends ConsumerWidget {
  const HomeTabContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: HomeSearchBar(tokens: t)),
        SliverToBoxAdapter(
          child: _SectionLabel(label: 'Recent saves', tokens: t),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          sliver: SliverList.separated(
            itemCount: _placeholderItems.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, i) =>
                ExampleSaveCard(item: _placeholderItems[i], tokens: t),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const _placeholderItems = [
  (
    title: 'Getting started with your app',
    subtitle: 'Tap any card to open the original link',
    icon: Icons.rocket_launch_rounded,
  ),
  (
    title: 'Replace this with your domain model',
    subtitle: 'Connect a Firestore collection or REST API',
    icon: Icons.storage_rounded,
  ),
  (
    title: 'Design V2 is configured',
    subtitle: 'Tokens, elevation, motion and snackbar theme are all ready',
    icon: Icons.palette_rounded,
  ),
];

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label, required this.tokens});

  final String label;
  final AppTokens tokens;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
      child: Text(
        label,
        style: TextStyle(
          color: tokens.textSecondary,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
