import 'package:cloud_firestore/cloud_firestore.dart';

/// Star distribution in a rating
class RatingDistribution {
  final int one;
  final int two;
  final int three;
  final int four;
  final int five;

  RatingDistribution({
    this.one = 0,
    this.two = 0,
    this.three = 0,
    this.four = 0,
    this.five = 0,
  });

  factory RatingDistribution.fromJson(Map<String, dynamic> json) =>
      RatingDistribution(
        one: json['one'] ?? 0,
        two: json['two'] ?? 0,
        three: json['three'] ?? 0,
        four: json['four'] ?? 0,
        five: json['five'] ?? 0,
      );

  Map<String, dynamic> toJson() => {
    'one': one,
    'two': two,
    'three': three,
    'four': four,
    'five': five,
  };
}

/// Professional rating model similar to Zomato/Google Reviews
class Rating {
  /// Average rating (0-5) calculated from all reviews
  final double average;

  /// Total number of reviews received
  final int totalReviews;

  /// Distribution of reviews by star count
  final RatingDistribution distribution;

  /// Timestamp of the most recent review
  final DateTime? lastReviewedAt;

  /// Month-wise review statistics for trending
  final Map<String, int>? monthlyReviews;

  Rating({
    required this.average,
    required this.totalReviews,
    required this.distribution,
    this.lastReviewedAt,
    this.monthlyReviews,
  });

  /// Create a default rating (no reviews yet)
  factory Rating.empty() =>
      Rating(average: 0, totalReviews: 0, distribution: RatingDistribution());

  factory Rating.fromJson(Map<String, dynamic> json) => Rating(
    average: (json['average'] as num?)?.toDouble() ?? 0,
    totalReviews: json['totalReviews'] ?? 0,
    distribution: RatingDistribution.fromJson(json['distribution'] ?? {}),
    lastReviewedAt: (json['lastReviewedAt'] as Timestamp?)?.toDate(),
    monthlyReviews: json['monthlyReviews'] != null
        ? Map<String, int>.from(json['monthlyReviews'])
        : null,
  );

  Map<String, dynamic> toJson() => {
    'average': average,
    'totalReviews': totalReviews,
    'distribution': distribution.toJson(),
    if (lastReviewedAt != null)
      'lastReviewedAt': Timestamp.fromDate(lastReviewedAt!),
    if (monthlyReviews != null) 'monthlyReviews': monthlyReviews,
  };

  /// Get star fill percentage (0-100) for UI display
  int getStarFillPercentage(int starCount) {
    if (totalReviews == 0) return 0;
    final count = _getStarCount(starCount);
    return ((count / totalReviews) * 100).toInt();
  }

  /// Get count of reviews for a specific star rating
  int _getStarCount(int stars) {
    switch (stars) {
      case 1:
        return distribution.one;
      case 2:
        return distribution.two;
      case 3:
        return distribution.three;
      case 4:
        return distribution.four;
      case 5:
        return distribution.five;
      default:
        return 0;
    }
  }

  /// Format average rating for display (e.g., "4.5")
  String get displayRating => average.toStringAsFixed(1);

  /// Get rating badge text (e.g., "Highly Rated")
  String get ratingBadge {
    if (average >= 4.5) return 'Excellent';
    if (average >= 4.0) return 'Very Good';
    if (average >= 3.5) return 'Good';
    if (average >= 3.0) return 'Average';
    return 'Poor';
  }
}

/// Individual review data
class Review {
  final String id;
  final int rating; // 1-5
  final String title;
  final String content;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String? shopId;
  final String? productId;
  final String orderId;
  final bool isVerifiedBuyer;
  final int helpfulCount;
  final int unhelpfulCount;
  final List<String> attachmentUrls;
  final String status; // pending, approved, rejected, archived
  final DateTime createdAt;
  final DateTime updatedAt;

  Review({
    required this.id,
    required this.rating,
    required this.title,
    required this.content,
    required this.userId,
    required this.userName,
    this.userAvatar,
    this.shopId,
    this.productId,
    required this.orderId,
    this.isVerifiedBuyer = false,
    this.helpfulCount = 0,
    this.unhelpfulCount = 0,
    this.attachmentUrls = const [],
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
    id: json['id'] ?? '',
    rating: json['rating'] ?? 0,
    title: json['title'] ?? '',
    content: json['content'] ?? '',
    userId: json['userId'] ?? '',
    userName: json['userName'] ?? 'Anonymous',
    userAvatar: json['userAvatar'],
    shopId: json['shopId'],
    productId: json['productId'],
    orderId: json['orderId'] ?? '',
    isVerifiedBuyer: json['isVerifiedBuyer'] ?? false,
    helpfulCount: json['helpfulCount'] ?? 0,
    unhelpfulCount: json['unhelpfulCount'] ?? 0,
    attachmentUrls: List<String>.from(json['attachmentUrls'] ?? []),
    status: json['status'] ?? 'pending',
    createdAt: (json['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    updatedAt: (json['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'rating': rating,
    'title': title,
    'content': content,
    'userId': userId,
    'userName': userName,
    if (userAvatar != null) 'userAvatar': userAvatar,
    if (shopId != null) 'shopId': shopId,
    if (productId != null) 'productId': productId,
    'orderId': orderId,
    'isVerifiedBuyer': isVerifiedBuyer,
    'helpfulCount': helpfulCount,
    'unhelpfulCount': unhelpfulCount,
    'attachmentUrls': attachmentUrls,
    'status': status,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
  };
}

/// Request payload for adding/updating a review
class AddReviewRequest {
  final int rating; // 1-5
  final String? title;
  final String? content;
  final String targetId;
  final String targetType; // 'shop' or 'product'
  final String orderId;
  final String? productId;
  final String? shopId;
  final List<String>? attachmentUrls;

  AddReviewRequest({
    required this.rating,
    this.title,
    this.content,
    required this.targetId,
    required this.targetType,
    required this.orderId,
    this.productId,
    this.shopId,
    this.attachmentUrls,
  });

  Map<String, dynamic> toJson() => {
    'rating': rating,
    if (title != null) 'title': title,
    if (content != null) 'content': content,
    'targetId': targetId,
    'targetType': targetType,
    'orderId': orderId,
    if (productId != null) 'productId': productId,
    if (shopId != null) 'shopId': shopId,
    if (attachmentUrls != null) 'attachmentUrls': attachmentUrls,
  };
}
