import 'package:flutter/material.dart';
import '../../config/app_tokens.dart';

/// AI-native search input following Design V2 guidelines.
///
/// - Placeholder copy: "Ask anything or search..."
/// - Co-located action buttons (camera / mic) inside the search shell.
/// - Strong focus ring, keyboard-accessible.
/// - Touch target >= 48 px.
class HomeSearchBar extends StatefulWidget {
  const HomeSearchBar({super.key, required this.tokens});

  final AppTokens tokens;

  @override
  State<HomeSearchBar> createState() => _HomeSearchBarState();
}

class _HomeSearchBarState extends State<HomeSearchBar> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  bool _hasFocus = false;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() => _hasFocus = _focus.hasFocus));
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.tokens;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: t.surfaceRaised,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _hasFocus ? t.accentPrimary : t.borderDefault,
            width: _hasFocus ? 1.5 : 1,
          ),
          boxShadow: _hasFocus
              ? [
                  BoxShadow(
                    color: t.accentPrimary.withOpacity(0.10),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 14),
              child: Icon(
                Icons.search_rounded,
                size: 20,
                color: _hasFocus ? t.accentPrimary : t.textMuted,
              ),
            ),
            Expanded(
              child: TextField(
                controller: _controller,
                focusNode: _focus,
                style: TextStyle(color: t.textPrimary, fontSize: 15),
                decoration: InputDecoration(
                  hintText: 'Ask anything or search…',
                  hintStyle: TextStyle(
                    color: t.textMuted,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 14,
                  ),
                ),
                onSubmitted: (value) {
                  // TODO: handle search/AI query
                },
              ),
            ),
            _SearchAction(
              icon: Icons.mic_rounded,
              tooltip: 'Voice search',
              color: t.textMuted,
              onTap: () {
                /* TODO: voice */
              },
            ),
            _SearchAction(
              icon: Icons.camera_alt_rounded,
              tooltip: 'Visual search',
              color: t.textMuted,
              onTap: () {
                /* TODO: camera */
              },
            ),
            const SizedBox(width: 4),
          ],
        ),
      ),
    );
  }
}

class _SearchAction extends StatelessWidget {
  const _SearchAction({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, size: 20, color: color),
        ),
      ),
    );
  }
}
