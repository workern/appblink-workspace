import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_ui_firestore/firebase_ui_firestore.dart';
import 'package:flutter/material.dart';
import 'workern_skeleton_loader.dart';

/// A reusable list view widget for displaying Firestore data with infinite scrolling.
///
/// This widget wraps Firebase UI's FirestoreListView and FirestoreQueryBuilder with additional features:
/// - Grid or list layout support
/// - Custom loading and error states
/// - Empty state handling
/// - Automatic pagination
///
/// Example usage:
/// ```dart
/// WorkernListView<MyModel>(
///   query: FirebaseFirestore.instance
///     .collection('items')
///     .orderBy('createdAt', descending: true)
///     .withConverter<MyModel>(
///       fromFirestore: (snapshot, _) => MyModel.fromFirestore(snapshot.data()!, snapshot.id),
///       toFirestore: (model, _) => model.toFirestore(),
///     ),
///   itemBuilder: (context, doc) {
///     final item = doc.data();
///     return MyItemCard(item: item);
///   },
///   emptyBuilder: (context) => Text('No items found'),
/// )
/// ```
class WorkernListView<T> extends StatelessWidget {
  /// The Firestore query to fetch data from
  final Query<T> query;

  /// Builder for individual list items
  final Widget Function(BuildContext context, QueryDocumentSnapshot<T> doc)
  itemBuilder;

  /// Number of items to fetch per page (defaults to 20)
  final int pageSize;

  /// Whether to display as a grid (defaults to true)
  final bool isGrid;

  /// Number of columns in grid layout (defaults to 2)
  final int gridCrossAxisCount;

  /// Space between grid items (defaults to 12)
  final double gridSpacing;

  /// Aspect ratio for grid items (defaults to 0.8)
  final double gridChildAspectRatio;

  /// Custom loading indicator (optional)
  final Widget Function(BuildContext context)? loadingBuilder;

  /// Custom error widget (optional)
  final Widget Function(BuildContext context, Object error, StackTrace? stack)?
  errorBuilder;

  /// Custom empty state widget (optional)
  final Widget Function(BuildContext context)? emptyBuilder;

  /// Padding around the list/grid (defaults to 16)
  final EdgeInsets padding;

  /// Scroll controller (optional)
  final ScrollController? controller;

  /// Scroll physics (optional)
  final ScrollPhysics? physics;

  /// Whether the list is scrollable (defaults to true)
  final bool shrinkWrap;

  const WorkernListView({
    super.key,
    required this.query,
    required this.itemBuilder,
    this.pageSize = 20,
    this.isGrid = true,
    this.gridCrossAxisCount = 2,
    this.gridSpacing = 12,
    this.gridChildAspectRatio = 0.8,
    this.loadingBuilder,
    this.errorBuilder,
    this.emptyBuilder,
    this.padding = const EdgeInsets.all(16),
    this.controller,
    this.physics,
    this.shrinkWrap = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isGrid) {
      // Use FirestoreQueryBuilder for grid layouts
      return FirestoreQueryBuilder<T>(
        query: query,
        pageSize: pageSize,
        builder: (context, snapshot, _) {
          if (snapshot.isFetching && !snapshot.hasData) {
            return loadingBuilder?.call(context) ??
                const WorkernSkeletonLoader(
                  type: SkeletonType.card,
                  itemCount: 6,
                );
          }

          if (snapshot.hasError) {
            return errorBuilder?.call(context, snapshot.error!, null) ??
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading data',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        snapshot.error.toString(),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                );
          }

          if (snapshot.docs.isEmpty) {
            return emptyBuilder?.call(context) ??
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 80,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No items found',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                );
          }

          return GridView.builder(
            padding: padding,
            controller: controller,
            physics: physics,
            shrinkWrap: shrinkWrap,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: gridCrossAxisCount,
              crossAxisSpacing: gridSpacing,
              mainAxisSpacing: gridSpacing,
              childAspectRatio: gridChildAspectRatio,
            ),
            // Add +1 to itemCount when hasMore to trigger loading indicator
            itemCount: snapshot.hasMore
                ? snapshot.docs.length + 1
                : snapshot.docs.length,
            itemBuilder: (context, index) {
              // Show loading indicator at the end if fetching more
              if (index >= snapshot.docs.length) {
                if (snapshot.isFetchingMore) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  );
                }
                // Trigger fetch more
                snapshot.fetchMore();
                return const SizedBox.shrink();
              }

              final doc = snapshot.docs[index];
              return itemBuilder(context, doc);
            },
          );
        },
      );
    } else {
      // List layout
      return FirestoreListView<T>(
        query: query,
        pageSize: pageSize,
        padding: padding,
        controller: controller,
        physics: physics,
        shrinkWrap: shrinkWrap,
        itemBuilder: (context, doc) => itemBuilder(context, doc),
        loadingBuilder:
            loadingBuilder ??
            (context) => const WorkernSkeletonLoader(
              type: SkeletonType.list,
              itemCount: 5,
            ),
        errorBuilder:
            errorBuilder ??
            (context, error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Colors.red.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading data',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    error.toString(),
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
        emptyBuilder:
            emptyBuilder ??
            (context) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inbox_outlined,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No items found',
                    style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
      );
    }
  }
}
