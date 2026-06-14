import 'package:flutter/material.dart';

/// A reusable search bar backed by Flutter's native [SearchAnchor] +
/// [SearchBar] widgets.
///
/// Opening the bar shows a full-screen suggestions overlay. The content of
/// that overlay is completely controlled by the caller via [suggestionsBuilder].
///
/// **Simple (tap-to-navigate) usage:**
/// ```dart
/// WorkernSearchBar(
///   placeholder: 'Find shops & products…',
///   suggestionsBuilder: (context, controller) => const [],
///   onTap: () => context.push('/search'),
/// )
/// ```
///
/// **Full suggestions usage:**
/// ```dart
/// WorkernSearchBar(
///   placeholder: 'Find shops & products…',
///   suggestionsBuilder: (context, controller) {
///     final query = controller.text;
///     if (query.isEmpty) return [const _EmptyPrompt()];
///     return results.map((r) => ListTile(title: Text(r))).toList();
///   },
/// )
/// ```
class WorkernSearchBar extends StatefulWidget {
  const WorkernSearchBar({
    super.key,
    required this.suggestionsBuilder,
    this.placeholder = 'Search…',
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.trailingIcon,
    this.onTrailingTap,
    this.trailingTooltip = '',
    this.semanticLabel,
    this.viewHintText,
    this.viewLeading,
    this.viewTrailing,
    this.viewOnChanged,
    this.searchController,
  });

  /// Builds the suggestions shown inside the search overlay.
  /// Mirrors [SearchAnchor.suggestionsBuilder].
  final SuggestionsBuilder suggestionsBuilder;

  /// Placeholder text shown in the collapsed search bar.
  final String placeholder;

  /// Called when the collapsed [SearchBar] pill is tapped (before the view
  /// opens). Useful for analytics or to intercept and navigate instead.
  final VoidCallback? onTap;

  /// Called on every keystroke inside the open search view.
  final ValueChanged<String>? onChanged;

  /// Called when the user submits the search (keyboard action).
  final ValueChanged<String>? onSubmitted;

  /// Optional icon shown as a trailing action next to the collapsed bar.
  final IconData? trailingIcon;

  /// Called when the trailing icon button is tapped.
  final VoidCallback? onTrailingTap;

  /// Tooltip for the trailing button (accessibility).
  final String trailingTooltip;

  /// Accessibility label for the whole search bar.
  final String? semanticLabel;

  /// Hint text shown inside the open search overlay (defaults to [placeholder]).
  final String? viewHintText;

  /// Custom leading widget for the search overlay.
  final Widget? viewLeading;

  /// Custom trailing widgets for the search overlay.
  final Iterable<Widget>? viewTrailing;

  /// Called when the text changes inside the open search overlay.
  final ValueChanged<String>? viewOnChanged;

  /// Externally-supplied [SearchController]. If null, one is created internally.
  final SearchController? searchController;

  @override
  State<WorkernSearchBar> createState() => _WorkernSearchBarState();
}

class _WorkernSearchBarState extends State<WorkernSearchBar> {
  late final SearchController _internalController;

  SearchController get _controller =>
      widget.searchController ?? _internalController;

  @override
  void initState() {
    super.initState();
    if (widget.searchController == null) {
      _internalController = SearchController();
    }
  }

  @override
  void dispose() {
    if (widget.searchController == null) {
      _internalController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Semantics(
            label: widget.semanticLabel ?? widget.placeholder,
            child: SearchAnchor(
              searchController: _controller,
              viewHintText: widget.viewHintText ?? widget.placeholder,
              viewBackgroundColor: cs.surface,
              viewLeading: widget.viewLeading ??
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () {
                      _controller.closeView(null);
                      _controller.clear();
                    },
                  ),
              viewTrailing: widget.viewTrailing,
              viewOnChanged: (value) {
                widget.onChanged?.call(value);
                widget.viewOnChanged?.call(value);
              },
              viewOnSubmitted: widget.onSubmitted,
              suggestionsBuilder: widget.suggestionsBuilder,
              builder: (context, controller) {
                return SearchBar(
                  controller: controller,
                  hintText: widget.placeholder,
                  hintStyle: WidgetStateProperty.all(
                    TextStyle(
                      fontSize: 15,
                      color: cs.onSurface.withValues(alpha: 0.45),
                    ),
                  ),
                  textStyle: WidgetStateProperty.all(
                    TextStyle(fontSize: 15, color: cs.onSurface),
                  ),
                  leading: Icon(
                    Icons.search_rounded,
                    color: cs.onSurfaceVariant,
                    size: 22,
                  ),
                  trailing: [
                    if (controller.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        color: cs.onSurfaceVariant,
                        iconSize: 20,
                        onPressed: () => controller.clear(),
                      ),
                  ],
                  onTap: () {
                    widget.onTap?.call();
                    controller.openView();
                  },
                  onChanged: (value) {
                    if (!_controller.isOpen) controller.openView();
                    widget.onChanged?.call(value);
                  },
                  backgroundColor: WidgetStateProperty.all(cs.surface),
                  elevation: WidgetStateProperty.all(0),
                  side: WidgetStateProperty.all(
                    BorderSide(
                      color: cs.outline.withValues(alpha: 0.25),
                      width: 1,
                    ),
                  ),
                  shadowColor: WidgetStateProperty.all(
                    cs.shadow.withValues(alpha: 0.06),
                  ),
                  padding: WidgetStateProperty.all(
                    const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  shape: WidgetStateProperty.all(
                    RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                  constraints: const BoxConstraints(
                    minHeight: 52,
                    maxHeight: 52,
                  ),
                );
              },
            ),
          ),
        ),
        if (widget.trailingIcon != null) ...[
          const SizedBox(width: 8),
          _TrailingButton(
            icon: widget.trailingIcon!,
            tooltip: widget.trailingTooltip,
            onPressed: widget.onTrailingTap,
            cs: cs,
          ),
        ],
      ],
    );
  }
}

// ─── Private widgets ──────────────────────────────────────────────────────────

class _TrailingButton extends StatelessWidget {
  const _TrailingButton({
    required this.icon,
    required this.tooltip,
    required this.cs,
    this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: tooltip,
      child: Tooltip(
        message: tooltip,
        child: Material(
          color: cs.surface,
          borderRadius: BorderRadius.circular(14),
          elevation: 0,
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: onPressed,
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                border: Border.all(
                  color: cs.outline.withValues(alpha: 0.25),
                  width: 1,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: cs.shadow.withValues(alpha: 0.06),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: onPressed == null
                    ? cs.onSurfaceVariant.withValues(alpha: 0.35)
                    : cs.onSurfaceVariant,
                size: 22,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
