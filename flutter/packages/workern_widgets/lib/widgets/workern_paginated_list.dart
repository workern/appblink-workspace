import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';



/// State object representing the status of a paginated list.
class PaginatedState<T> {
  final List<T> items;
  final List<DocumentSnapshot> docs;
  final bool isLoading;
  final bool isFetchingMore;
  final bool hasMore;
  final String? error;

  PaginatedState({
    required this.items,
    required this.docs,
    required this.isLoading,
    required this.isFetchingMore,
    required this.hasMore,
    this.error,
  });

  PaginatedState<T> copyWith({
    List<T>? items,
    List<DocumentSnapshot>? docs,
    bool? isLoading,
    bool? isFetchingMore,
    bool? hasMore,
    String? error,
  }) {
    return PaginatedState<T>(
      items: items ?? this.items,
      docs: docs ?? this.docs,
      isLoading: isLoading ?? this.isLoading,
      isFetchingMore: isFetchingMore ?? this.isFetchingMore,
      hasMore: hasMore ?? this.hasMore,
      error: error,
    );
  }
}

/// A generic [Notifier] that handles paginated fetching of documents from Firestore.
abstract class PaginatedNotifier<T, Arg> extends Notifier<PaginatedState<T>> {
  final Arg arg;
  PaginatedNotifier(this.arg);

  Query queryBuilder(Arg arg, DocumentSnapshot? lastDoc);
  T mapper(DocumentSnapshot doc);
  int get limit => 15;

  @override
  PaginatedState<T> build() {
    return PaginatedState<T>(
      items: [],
      docs: [],
      isLoading: false,
      isFetchingMore: false,
      hasMore: true,
    );
  }

  /// Initialize and load the first page if not already loaded.
  Future<void> init() async {
    if (state.items.isNotEmpty || state.isLoading) return;
    await fetchNextPage(isInit: true);
  }

  /// Reset state and reload the first page.
  Future<void> refresh() async {
    state = PaginatedState<T>(
      items: [],
      docs: [],
      isLoading: true,
      isFetchingMore: false,
      hasMore: true,
    );
    await fetchNextPage(isInit: true);
  }

  /// Fetch the next page of items.
  Future<void> fetchNextPage({bool isInit = false}) async {
    if (state.isFetchingMore || !state.hasMore) return;
    if (state.isLoading && !isInit) return;

    if (isInit) {
      state = state.copyWith(isLoading: true, error: null);
    } else {
      state = state.copyWith(isFetchingMore: true, error: null);
    }

    try {
      final lastDoc = state.docs.isNotEmpty ? state.docs.last : null;
      final q = queryBuilder(arg, lastDoc);
      final snapshot = await q.get();

      final newItems = snapshot.docs.map(mapper).toList();
      final hasMore = snapshot.docs.length >= limit;

      state = state.copyWith(
        items: isInit ? newItems : [...state.items, ...newItems],
        docs: isInit ? snapshot.docs : [...state.docs, ...snapshot.docs],
        isLoading: false,
        isFetchingMore: false,
        hasMore: hasMore,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isFetchingMore: false,
        error: e.toString(),
      );
    }
  }
}

/// A reusable ListView wrapper that listens to scroll notifications and automatically
/// triggers pagination callbacks when scrolled near the bottom.
class WorkernPaginatedListView<T> extends StatefulWidget {
  final List<T> items;
  final bool isLoading;
  final bool isFetchingMore;
  final bool hasMore;
  final String? error;
  final VoidCallback onLoadMore;
  final Future<void> Function() onRefresh;
  final Widget Function(BuildContext context, int index, T item) itemBuilder;
  final Widget separator;
  final Widget? emptyState;
  final Widget? loadingPlaceholder;
  final EdgeInsetsGeometry? padding;
  final bool isGrid;
  final SliverGridDelegate? gridDelegate;

  const WorkernPaginatedListView({
    super.key,
    required this.items,
    required this.isLoading,
    required this.isFetchingMore,
    required this.hasMore,
    this.error,
    required this.onLoadMore,
    required this.onRefresh,
    required this.itemBuilder,
    this.separator = const SizedBox(height: 10),
    this.emptyState,
    this.loadingPlaceholder,
    this.padding,
    this.isGrid = false,
    this.gridDelegate,
  });

  @override
  State<WorkernPaginatedListView<T>> createState() => _WorkernPaginatedListViewState<T>();
}

class _WorkernPaginatedListViewState<T> extends State<WorkernPaginatedListView<T>> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      widget.onLoadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return widget.loadingPlaceholder ?? const Center(child: CircularProgressIndicator());
    }

    if (widget.error != null && widget.items.isEmpty) {
      final cs = Theme.of(context).colorScheme;
      final tt = Theme.of(context).textTheme;
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: cs.error),
              const SizedBox(height: 16),
              Text(
                'Could not load items',
                style: tt.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                widget.error!,
                style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: widget.onRefresh,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (widget.items.isEmpty) {
      return widget.emptyState ?? const Center(child: Text('No items found'));
    }

    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      child: widget.isGrid
          ? GridView.builder(
              controller: _scrollController,
              padding: widget.padding,
              physics: const AlwaysScrollableScrollPhysics(),
              gridDelegate: widget.gridDelegate ??
                  const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.8,
                  ),
              itemCount: widget.items.length + (widget.hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == widget.items.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    ),
                  );
                }
                return widget.itemBuilder(context, index, widget.items[index]);
              },
            )
          : ListView.separated(
              controller: _scrollController,
              padding: widget.padding,
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: widget.items.length + (widget.hasMore ? 1 : 0),
              separatorBuilder: (_, __) => widget.separator,
              itemBuilder: (context, index) {
                if (index == widget.items.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    ),
                  );
                }
                return widget.itemBuilder(context, index, widget.items[index]);
              },
            ),
    );
  }
}
