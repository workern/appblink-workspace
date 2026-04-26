import 'package:flutter/material.dart';
import 'package:skeletonizer/skeletonizer.dart';

/// A versatile skeleton loader widget using Skeletonizer package
/// Supports multiple preset types for different UI patterns
class WorkernSkeletonLoader extends StatelessWidget {
  final SkeletonType type;
  final int itemCount;
  final PaintingEffect? effect;

  const WorkernSkeletonLoader({
    super.key,
    this.type = SkeletonType.list,
    this.itemCount = 3,
    this.effect,
  });

  @override
  Widget build(BuildContext context) {
    return Skeletonizer.zone(
      effect: effect ?? const ShimmerEffect(),
      child: _buildSkeletonContent(),
    );
  }

  Widget _buildSkeletonContent() {
    switch (type) {
      case SkeletonType.list:
        return _buildListSkeleton();
      case SkeletonType.card:
        return _buildCardSkeleton();
      case SkeletonType.searchResults:
        return _buildSearchResultsSkeleton();
      case SkeletonType.grid:
        return _buildGridSkeleton();
      case SkeletonType.profile:
        return _buildProfileSkeleton();
      case SkeletonType.post:
        return _buildPostSkeleton();
      case SkeletonType.custom:
        return const SizedBox.shrink();
    }
  }

  Widget _buildListSkeleton() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const Card(
        child: ListTile(
          leading: Bone.circle(size: 48),
          title: Bone.text(words: 2),
          subtitle: Bone.text(words: 3),
        ),
      ),
    );
  }

  Widget _buildCardSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => const Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: Bone.square(size: double.infinity)),
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Bone.text(words: 2),
                  SizedBox(height: 6),
                  Bone.text(words: 1),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResultsSkeleton() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const Card(
        child: ListTile(
          leading: Bone.square(size: 48),
          title: Bone.text(words: 2),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 4),
              Bone.text(words: 3),
              SizedBox(height: 2),
              Bone.text(words: 2),
            ],
          ),
          trailing: Bone.icon(),
        ),
      ),
    );
  }

  Widget _buildGridSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => const Bone.square(size: double.infinity),
    );
  }

  Widget _buildProfileSkeleton() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Bone.circle(size: 100),
          const SizedBox(height: 16),
          const Bone.text(words: 3),
          const SizedBox(height: 8),
          const Bone.text(words: 4),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [_buildStatBox(), _buildStatBox(), _buildStatBox()],
          ),
          const SizedBox(height: 24),
          ...List.generate(
            itemCount,
            (index) => const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Card(
                child: SizedBox(
                  height: 80,
                  child: ListTile(
                    leading: Bone.circle(size: 40),
                    title: Bone.text(words: 2),
                    subtitle: Bone.text(words: 3),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostSkeleton() {
    return ListView.builder(
      itemCount: itemCount,
      itemBuilder: (context, index) => const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.all(12),
            child: Row(
              children: [
                Bone.circle(size: 40),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Bone.text(words: 2),
                      SizedBox(height: 4),
                      Bone.text(words: 1),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Bone(height: 300, width: double.infinity),
          Padding(
            padding: EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Bone.text(words: 5),
                SizedBox(height: 6),
                Bone.text(words: 3),
              ],
            ),
          ),
          Divider(height: 1),
        ],
      ),
    );
  }

  Widget _buildStatBox() {
    return const Column(
      children: [Bone.text(words: 1), SizedBox(height: 4), Bone.text(words: 1)],
    );
  }
}

/// Predefined skeleton loader types
enum SkeletonType {
  /// Standard list with icon, title, and subtitle
  list,

  /// Grid of cards with image and text
  card,

  /// Search results with icon, multiple text lines, and arrow
  searchResults,

  /// Simple grid layout
  grid,

  /// Profile screen with avatar, stats, and content
  profile,

  /// Social media post style
  post,

  /// Custom layout
  custom,
}
