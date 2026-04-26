import 'package:flutter/material.dart';
import 'package:workern_models/workern_models.dart' as models;

/// Star review widget that submits ratings to Firebase
class StarReview extends StatefulWidget {
  final String shopName;
  final models.Review? review; // Existing review data if available
  final Future<void> Function(int rating) onSubmitRating;
  final VoidCallback? onViewFeedback;
  final bool showHeading; // Whether to show the "Rate {shopName}" heading
  final bool compact; // Compact mode for inline layout (Zomato style)

  const StarReview({
    super.key,
    required this.shopName,
    this.review,
    required this.onSubmitRating,
    this.onViewFeedback,
    this.showHeading = true,
    this.compact = false,
  });

  @override
  State<StarReview> createState() => _StarReviewState();
}

class _StarReviewState extends State<StarReview> {
  int _selectedRating = 0;
  bool _isLoading = false;

  Future<void> _submitRating(int rating) async {
    // Instantly show the selected rating on UI
    setState(() {
      _selectedRating = rating;
      _isLoading = true;
    });
    try {
      await widget.onSubmitRating(rating);
      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        // Reset on error
        setState(() {
          _selectedRating = 0;
          _isLoading = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error submitting rating: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasReview = widget.review != null;
    final rating = widget.review?.rating ?? 0;
    final hasContent = (widget.review?.content ?? '').isNotEmpty;

    // Compact mode for orders list (Zomato style)
    if (widget.compact) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasReview && rating > 0)
            // Show thank you message in compact mode
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Thank you for rating!',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'You rated $rating ',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Icon(Icons.star, size: 14, color: Colors.amber),
                  ],
                ),
                if (hasContent)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: GestureDetector(
                      onTap: widget.onViewFeedback,
                      child: const Text(
                        'View your feedback',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            )
          else
            // Compact rating selector - inline
            Row(
              children: [
                const Text(
                  'Rate',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(width: 8),
                ...List.generate(5, (index) {
                  final starRating = index + 1;
                  final isSelected = starRating <= _selectedRating;

                  return GestureDetector(
                    onTap: _isLoading ? null : () => _submitRating(starRating),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: Icon(
                        Icons.star,
                        size: 24,
                        color: isSelected ? Colors.amber : Colors.grey[300],
                      ),
                    ),
                  );
                }),
                if (_isLoading) ...[
                  const SizedBox(width: 8),
                  const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ],
              ],
            ),
          // if (!hasReview || rating == 0)
          //   Padding(
          //     padding: const EdgeInsets.only(top: 8),
          //     child: GestureDetector(
          //       onTap: widget.onViewFeedback,
          //       child: const Text(
          //         'View your feedback',
          //         style: TextStyle(
          //           fontSize: 12,
          //           color: Colors.red,
          //           fontWeight: FontWeight.w600,
          //         ),
          //       ),
          //     ),
          //   ),
        ],
      );
    }

    // Regular (non-compact) mode
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon and title (conditionally shown)
          if (widget.showHeading)
            Row(
              children: [
                Icon(Icons.rate_review, color: Colors.grey[700], size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Rate ${widget.shopName}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            )
          else
            const SizedBox(height: 0),
          if (widget.showHeading) const SizedBox(height: 16),
          if (hasReview && rating > 0)
            // Show feedback if review exists
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'Thank you for rating!',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'You rated $rating ',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Icon(Icons.star, size: 16, color: Colors.amber),
                  ],
                ),
                if (hasContent) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: widget.onViewFeedback,
                    child: const Text(
                      'View your feedback',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            )
          else
            // Show rating selector if no review
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ...List.generate(5, (index) {
                  final starRating = index + 1;
                  final isSelected = starRating <= _selectedRating;

                  return GestureDetector(
                    onTap: _isLoading ? null : () => _submitRating(starRating),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Icon(
                        Icons.star,
                        size: 32,
                        color: isSelected ? Colors.amber : Colors.grey[300],
                      ),
                    ),
                  );
                }),
                if (_isLoading) ...[
                  const SizedBox(width: 12),
                  const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ],
              ],
            ),
        ],
      ),
    );
  }
}
