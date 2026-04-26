import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import '../config/app_tokens.dart';

/// Placeholder Explore screen — replace with your app's search / discovery UI.
///
/// This is a tab screen rendered inside [AppShell]; it must NOT include its own
/// [Scaffold] or [AppBar] because the shell provides those.
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Search input ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: ShadInput(
              controller: _searchController,
              placeholder: const Text('Search anything…'),
              leading: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(Icons.search_rounded, size: 18),
              ),
            ),
          ),

          // ── Section label ─────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Text(
              'Trending topics',
              style: TextStyle(
                color: t.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ),

          // ── Placeholder chip grid ─────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _placeholderTopics.map((topic) {
                return _TopicChip(
                  label: topic.label,
                  icon: topic.icon,
                  tokens: t,
                );
              }).toList(),
            ),
          ),

          // ── Empty-state illustration ──────────────────────────────────
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.explore_outlined,
                    size: 60,
                    color: t.textMuted.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Build your discovery UI here',
                    style: TextStyle(color: t.textMuted, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Placeholder data ──────────────────────────────────────────────────────────

class _TopicData {
  const _TopicData({required this.label, required this.icon});
  final String label;
  final IconData icon;
}

const _placeholderTopics = [
  _TopicData(label: 'Design', icon: Icons.palette_rounded),
  _TopicData(label: 'Engineering', icon: Icons.code_rounded),
  _TopicData(label: 'Productivity', icon: Icons.bolt_rounded),
  _TopicData(label: 'Finance', icon: Icons.trending_up_rounded),
  _TopicData(label: 'Health', icon: Icons.favorite_rounded),
  _TopicData(label: 'AI & ML', icon: Icons.auto_awesome_rounded),
];

// ── Topic chip ────────────────────────────────────────────────────────────────

class _TopicChip extends StatelessWidget {
  const _TopicChip({
    required this.label,
    required this.icon,
    required this.tokens,
  });

  final String label;
  final IconData icon;
  final AppTokens tokens;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: tokens.surfaceRaised,
        border: Border.all(color: tokens.borderDefault),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: tokens.accentPrimary),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: tokens.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
