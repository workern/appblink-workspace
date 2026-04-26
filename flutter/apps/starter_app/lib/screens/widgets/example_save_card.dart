import 'package:flutter/material.dart';
import '../../config/app_tokens.dart';

/// Design V2 card demonstrating the elevation system.
///
/// - Resting: `elevation.1` — subtle shadow + border.
/// - Pressed: slight scale down (0.98) + stronger shadow.
class ExampleSaveCard extends StatefulWidget {
  const ExampleSaveCard({
    super.key,
    required this.item,
    required this.tokens,
  });

  final ({String title, String subtitle, IconData icon}) item;
  final AppTokens tokens;

  @override
  State<ExampleSaveCard> createState() => _ExampleSaveCardState();
}

class _ExampleSaveCardState extends State<ExampleSaveCard> {
  bool _pressed = false;

  AppTokens get t => widget.tokens;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {/* TODO: open detail */},
      child: AnimatedScale(
        scale: _pressed ? 0.98 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: t.surfaceRaised,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: t.borderDefault, width: 1),
            boxShadow: _pressed
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.10),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: t.accentSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(widget.item.icon, color: t.accentPrimary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: t.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      widget.item.subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: t.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right_rounded, color: t.textMuted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
