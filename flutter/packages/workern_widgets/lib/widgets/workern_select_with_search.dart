import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// A labeled select dropdown with built-in search functionality.
///
/// Wraps [ShadSelect.withSearch] and manages search state internally.
/// Filter items by providing a [searchPredicate] that receives each item
/// and the current search query.
class WorkernSelectWithSearch<T> extends StatefulWidget {
  const WorkernSelectWithSearch({
    super.key,
    required this.label,
    required this.items,
    required this.itemBuilder,
    required this.selectedOptionBuilder,
    required this.onChanged,
    this.initialValue,
    this.placeholder = 'Select an option',
    this.searchPlaceholder = 'Search...',
    this.noResultsText = 'No results found',
    this.searchPredicate,
  });

  final String label;
  final T? initialValue;
  final List<T> items;

  /// Builds the content inside each [ShadOption] row.
  final Widget Function(BuildContext context, T item) itemBuilder;

  /// Builds the selected value shown in the collapsed dropdown button.
  final Widget Function(BuildContext context, T value) selectedOptionBuilder;

  final ValueChanged<T?> onChanged;
  final String placeholder;
  final String searchPlaceholder;
  final String noResultsText;

  /// Returns true when [item] matches [query]. Defaults to a case-insensitive
  /// toString comparison when not provided.
  final bool Function(T item, String query)? searchPredicate;

  @override
  State<WorkernSelectWithSearch<T>> createState() =>
      _WorkernSelectWithSearchState<T>();
}

class _WorkernSelectWithSearchState<T>
    extends State<WorkernSelectWithSearch<T>> {
  String _query = '';

  bool _matches(T item) {
    if (_query.isEmpty) return true;
    if (widget.searchPredicate != null) {
      return widget.searchPredicate!(item, _query);
    }
    return item.toString().toLowerCase().contains(_query.toLowerCase());
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.items.where(_matches).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 4),
        SizedBox(
          width: double.infinity,
          child: ShadSelect<T>.withSearch(
            initialValue: widget.initialValue,
            placeholder: Text(widget.placeholder),
            searchPlaceholder: Text(widget.searchPlaceholder),
            onSearchChanged: (value) => setState(() => _query = value),
            options: [
              if (filtered.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text(widget.noResultsText)),
                ),
              ...widget.items.map(
                (item) => Offstage(
                  offstage: !_matches(item),
                  child: ShadOption<T>(
                    value: item,
                    child: widget.itemBuilder(context, item),
                  ),
                ),
              ),
            ],
            selectedOptionBuilder: widget.selectedOptionBuilder,
            onChanged: (value) {
              setState(() => _query = '');
              widget.onChanged(value);
            },
          ),
        ),
      ],
    );
  }
}
