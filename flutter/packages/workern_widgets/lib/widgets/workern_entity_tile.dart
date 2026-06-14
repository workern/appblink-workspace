import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// A rich entity list tile: letter-avatar · name · optional badge · optional
/// trailing label · optional ghost edit button.
///
/// Designed for lists of named domain objects (products, services, contacts,
/// menu items, etc.). The layout is fixed — only the data slots are variable —
/// so all entity lists in the app look consistent without per-screen styling.
///
/// ## Slots
/// | Slot | Type | Notes |
/// |------|------|-------|
/// | `name` | `String` | Required. Shown in `bodyLarge` weight 600. Letter avatar auto-generated. |
/// | `badge` | `Widget?` | Optional. Shown below the name — typically a [ShadBadge]. |
/// | `trailing` | `String?` | Optional. Shown on the right — typically a price or count. |
/// | `onEdit` | `VoidCallback?` | Optional. Shows a ghost edit icon button. Hidden if null. |
/// | `useGlass` | `bool` | If true, applies a backdrop filter and semi-transparent background. |
///
/// ## Typical use-cases
/// - Inventory / product items (badge = stock status, trailing = price)
/// - Service listings (badge = availability, trailing = rate)
/// - Menu items (badge = dietary tag, trailing = price)
/// - Any named entity where a status badge and optional action are needed
///
/// ## Example
/// ```dart
/// WorkernEntityTile(
///   name: 'Leather Jacket',
///   badge: ShadBadge.destructive(child: const Text('Out of stock')),
///   trailing: '₹2,499',
///   onTap: () => context.push('/items/123'),
///   onEdit: () => context.push('/items/edit/123'),
///   useGlass: true,
/// )
///
/// // Minimal — no badge, no edit button
/// WorkernEntityTile(
///   name: 'Delivery Fee',
///   trailing: '₹40',
///   onTap: () {},
/// )
/// ```
///
/// ## AI agent guidance
/// Use [WorkernEntityTile] instead of building a custom ListTile with an
/// avatar, badge, price, and edit button. Pass `null` for [badge], [trailing],
/// or [onEdit] to hide those slots. The letter avatar and ink ripple are
/// always present and cannot be hidden.
class WorkernEntityTile extends StatelessWidget {
  /// Display name of the entity. Used as the avatar initial and title text.
  final String name;

  /// Optional status badge rendered below [name]. Typically a [ShadBadge].
  final Widget? badge;

  /// Optional trailing label (price, count, etc.) rendered on the right.
  final String? trailing;

  /// Called when the tile row is tapped.
  final VoidCallback onTap;

  /// When non-null, a ghost edit icon button is shown on the right.
  final VoidCallback? onEdit;

  /// If true, applies a glassmorphic effect.
  final bool useGlass;

  const WorkernEntityTile({
    super.key,
    required this.name,
    this.badge,
    this.trailing,
    required this.onTap,
    this.onEdit,
    this.useGlass = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    final Widget card = ShadCard(
      padding: EdgeInsets.zero,
      radius: BorderRadius.circular(20),
      backgroundColor: useGlass ? cs.surface.withValues(alpha: 0.6) : null,
      border: useGlass
          ? ShadBorder.all(color: cs.outlineVariant.withValues(alpha: 0.3))
          : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        splashColor: cs.primary.withValues(alpha: 0.07),
        highlightColor: cs.primary.withValues(alpha: 0.04),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // ── Letter avatar ──────────────────────────────────────────
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: useGlass
                      ? cs.primaryContainer.withValues(alpha: 0.4)
                      : cs.primaryContainer,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: tt.titleMedium?.copyWith(
                    color: cs.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // ── Name + badge ───────────────────────────────────────────
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: tt.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (badge != null) ...[const SizedBox(height: 5), badge!],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // ── Trailing + edit ────────────────────────────────────────
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (trailing != null)
                    Text(
                      trailing!,
                      style: tt.titleSmall?.copyWith(
                        color: cs.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  if (onEdit != null) ...[
                    const SizedBox(height: 2),
                    ShadButton.ghost(
                      onPressed: onEdit,
                      padding: const EdgeInsets.all(6),
                      size: ShadButtonSize.sm,
                      child: const Icon(Icons.edit_outlined, size: 18),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (useGlass) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: card,
        ),
      );
    }

    return card;
  }
}
