import 'package:flutter/material.dart';
import 'package:workern_models/rating/rating.dart';

/// Displays star rating with count
class RatingDisplay extends StatelessWidget {
  final Rating rating;
  final double size;
  final Color starColor;
  final bool showCount;
  final TextStyle? textStyle;

  const RatingDisplay({
    super.key,
    required this.rating,
    this.size = 20,
    this.starColor = Colors.amber,
    this.showCount = true,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildStars(),
        if (showCount) ...[
          const SizedBox(width: 8),
          Text(
            '${rating.displayRating} (${rating.totalReviews})',
            style:
                textStyle ??
                Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ],
    );
  }

  Widget _buildStars() {
    return SizedBox(
      height: size,
      child: Row(
        children: List.generate(5, (index) {
          final starRating = index + 1;
          final isFilled = starRating <= rating.average.floor();
          final isHalf =
              starRating == rating.average.ceil() && rating.average % 1 != 0;

          return Icon(
            isHalf ? Icons.star_half : Icons.star,
            size: size,
            color: isFilled || isHalf ? starColor : Colors.grey[300],
          );
        }),
      ),
    );
  }
}

/// Shows star rating distribution (like Zomato)
class RatingDistributionWidget extends StatelessWidget {
  final Rating rating;
  final double height;

  const RatingDistributionWidget({
    super.key,
    required this.rating,
    this.height = 6,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(5, (index) {
        final starCount = 5 - index;
        final count = _getStarCount(starCount);
        final percentage = rating.totalReviews > 0
            ? (count / rating.totalReviews) * 100
            : 0;

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              SizedBox(
                width: 30,
                child: Text(
                  '$starCount ★',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              Expanded(
                child: Container(
                  height: height,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(height / 2),
                  ),
                  child: FractionallySizedBox(
                    widthFactor: percentage / 100,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.amber,
                        borderRadius: BorderRadius.circular(height / 2),
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(
                width: 40,
                child: Text(
                  '$count',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  int _getStarCount(int stars) {
    switch (stars) {
      case 1:
        return rating.distribution.one;
      case 2:
        return rating.distribution.two;
      case 3:
        return rating.distribution.three;
      case 4:
        return rating.distribution.four;
      case 5:
        return rating.distribution.five;
      default:
        return 0;
    }
  }
}

/// Interactive star rating selector for adding reviews
class RatingSelector extends StatefulWidget {
  final int initialRating;
  final Function(int) onRatingChanged;
  final double size;
  final Color activeColor;

  const RatingSelector({
    super.key,
    this.initialRating = 0,
    required this.onRatingChanged,
    this.size = 40,
    this.activeColor = Colors.amber,
  });

  @override
  State<RatingSelector> createState() => _RatingSelectorState();
}

class _RatingSelectorState extends State<RatingSelector> {
  late int _selectedRating;

  @override
  void initState() {
    super.initState();
    _selectedRating = widget.initialRating;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        final starRating = index + 1;
        final isSelected = starRating <= _selectedRating;

        return GestureDetector(
          onTap: () {
            setState(() => _selectedRating = starRating);
            widget.onRatingChanged(starRating);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Icon(
              Icons.star,
              size: widget.size,
              color: isSelected ? widget.activeColor : Colors.grey[300],
            ),
          ),
        );
      }),
    );
  }
}

/// Form for submitting a review
class ReviewForm extends StatefulWidget {
  final int initialRating;
  final Function(ReviewFormData) onSubmit;
  final bool isLoading;
  final String? errorMessage;

  const ReviewForm({
    super.key,
    this.initialRating = 0,
    required this.onSubmit,
    this.isLoading = false,
    this.errorMessage,
  });

  @override
  State<ReviewForm> createState() => _ReviewFormState();
}

class ReviewFormData {
  final int rating;
  final String title;
  final String content;

  ReviewFormData({
    required this.rating,
    required this.title,
    required this.content,
  });
}

class _ReviewFormState extends State<ReviewForm> {
  late int _rating;
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _rating = widget.initialRating;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate() && _rating > 0) {
      widget.onSubmit(
        ReviewFormData(
          rating: _rating,
          title: _titleController.text,
          content: _contentController.text,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Rating selector
          Center(
            child: RatingSelector(
              initialRating: _rating,
              onRatingChanged: (rating) => setState(() => _rating = rating),
            ),
          ),
          const SizedBox(height: 16),

          // Error message
          if (widget.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  border: Border.all(color: Colors.red[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.errorMessage!,
                  style: TextStyle(color: Colors.red[700]),
                ),
              ),
            ),

          // Title field
          TextFormField(
            controller: _titleController,
            maxLength: 100,
            decoration: InputDecoration(
              labelText: 'Review Title',
              hintText: 'e.g., Great quality products',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Title is required';
              }
              if (value.length < 5) {
                return 'Title must be at least 5 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Content field
          TextFormField(
            controller: _contentController,
            maxLength: 500,
            maxLines: 5,
            decoration: InputDecoration(
              labelText: 'Your Review',
              hintText: 'Share your experience...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Review content is required';
              }
              if (value.length < 10) {
                return 'Review must be at least 10 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: widget.isLoading ? null : _submit,
              child: widget.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Submit Review'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Shows rating feedback after submission
class RatingFeedback extends StatelessWidget {
  final int rating;
  final String? message;
  final double starSize;
  final Color starColor;
  final TextStyle? textStyle;
  final EdgeInsets padding;
  final bool isCompact;

  const RatingFeedback({
    super.key,
    required this.rating,
    this.message,
    this.starSize = 24,
    this.starColor = Colors.amber,
    this.textStyle,
    this.padding = const EdgeInsets.all(16),
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      child: isCompact ? _buildCompact(context) : _buildDefault(context),
    );
  }

  Widget _buildDefault(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Thank you message
        Text(
          'Thank you for rating!',
          style:
              textStyle ??
              Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
        ),
        const SizedBox(height: 12),

        // Rating display with stars
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'You rated $rating ',
              style:
                  textStyle ??
                  Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: Colors.grey[700]),
            ),
            ...List.generate(
              rating,
              (index) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Icon(Icons.star, size: starSize, color: starColor),
              ),
            ),
          ],
        ),
        if (message != null) ...[
          const SizedBox(height: 12),
          Text(
            message!,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  Widget _buildCompact(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'You rated $rating ',
          style:
              textStyle ??
              Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
        ),
        ...List.generate(
          rating,
          (index) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 1),
            child: Icon(Icons.star, size: starSize, color: starColor),
          ),
        ),
      ],
    );
  }
}
