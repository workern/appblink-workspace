import 'package:workern_models/amount.dart';

/// Lightweight product snapshot stored inside the subscription doc.
class SubscriptionProductSnapshot {
  final String id;
  final String name;
  final String? description;
  final List<String>? features;

  const SubscriptionProductSnapshot({
    required this.id,
    required this.name,
    this.description,
    this.features,
  });

  factory SubscriptionProductSnapshot.fromJson(Map<String, dynamic> json) {
    return SubscriptionProductSnapshot(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      features: (json['features'] as List<dynamic>?)?.cast<String>(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    if (description != null) 'description': description,
    if (features != null) 'features': features,
  };
}

enum SubscriptionStatus {
  created,
  authenticated,
  active,
  pending,
  halted,
  paused,
  cancelled,
  completed,
  expired,
}

/// Stored at: users/{uid}/mySpaces/{appId}/subscriptions/{productId}
///
/// Keyed by productId — one doc per product per user. Re-subscriptions update
/// the same document in-place; the frontend can fetch it directly without a
/// collection query.
///
/// Maintained by webhook handlers – single doc the frontend reads to build
/// the billing UI.
class UserSubscription {
  final String id;
  final String appId;

  /// Transaction ID of the initial enrollment charge.
  final String? enrollmentTransactionId;

  /// Denormalized product snapshot for display.
  final SubscriptionProductSnapshot? product;
  final String subscriptionId;
  final String planId;
  final SubscriptionStatus status;
  final Amount amount;
  final DateTime? currentPeriodStart;

  /// End of the current billing period – shown as "next renewal date" in UI.
  final DateTime? currentPeriodEnd;

  /// Exact timestamp of the next scheduled charge.
  final DateTime? nextChargeAt;

  final int paidCount;
  final int totalCount;
  final int remainingCount;

  /// True once the user has requested cancellation at end of current billing cycle.
  final bool cancelAtCycleEnd;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserSubscription({
    required this.id,
    required this.appId,
    this.enrollmentTransactionId,
    this.product,
    required this.subscriptionId,
    required this.planId,
    required this.status,
    required this.amount,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.nextChargeAt,
    required this.paidCount,
    required this.totalCount,
    required this.remainingCount,
    this.cancelAtCycleEnd = false,
    required this.createdAt,
    required this.updatedAt,
  });

  static SubscriptionStatus _statusFromString(String? s) {
    switch (s) {
      case 'authenticated':
        return SubscriptionStatus.authenticated;
      case 'active':
        return SubscriptionStatus.active;
      case 'pending':
        return SubscriptionStatus.pending;
      case 'halted':
        return SubscriptionStatus.halted;
      case 'paused':
        return SubscriptionStatus.paused;
      case 'cancelled':
        return SubscriptionStatus.cancelled;
      case 'completed':
        return SubscriptionStatus.completed;
      case 'expired':
        return SubscriptionStatus.expired;
      case 'created':
      default:
        return SubscriptionStatus.created;
    }
  }

  static DateTime? _toDateTime(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    // Firestore Timestamp (has .toDate())
    try {
      return (value as dynamic).toDate() as DateTime;
    } catch (_) {
      return null;
    }
  }

  factory UserSubscription.fromJson(Map<String, dynamic> json) {
    return UserSubscription(
      id: json['id'] as String,
      appId: json['appId'] as String,
      enrollmentTransactionId: json['enrollmentTransactionId'] as String?,
      product: json['product'] != null
          ? SubscriptionProductSnapshot.fromJson(
              json['product'] as Map<String, dynamic>,
            )
          : null,
      subscriptionId: json['subscriptionId'] as String,
      planId: json['planId'] as String,
      status: _statusFromString(json['status'] as String?),
      amount: Amount.fromJson(json['amount'] as Map<String, dynamic>),
      currentPeriodStart: _toDateTime(json['currentPeriodStart']),
      currentPeriodEnd: _toDateTime(json['currentPeriodEnd']),
      nextChargeAt: _toDateTime(json['nextChargeAt']),
      paidCount: (json['paidCount'] as num?)?.toInt() ?? 0,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
      remainingCount: (json['remainingCount'] as num?)?.toInt() ?? 0,
      cancelAtCycleEnd: (json['cancelAtCycleEnd'] as bool?) ?? false,
      createdAt: _toDateTime(json['createdAt']) ?? DateTime.now(),
      updatedAt: _toDateTime(json['updatedAt']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'appId': appId,
    if (enrollmentTransactionId != null)
      'enrollmentTransactionId': enrollmentTransactionId,
    if (product != null) 'product': product!.toJson(),
    'subscriptionId': subscriptionId,
    'planId': planId,
    'status': status.name,
    'amount': amount.toJson(),
    'currentPeriodStart': currentPeriodStart?.toIso8601String(),
    'currentPeriodEnd': currentPeriodEnd?.toIso8601String(),
    'nextChargeAt': nextChargeAt?.toIso8601String(),
    'paidCount': paidCount,
    'totalCount': totalCount,
    'remainingCount': remainingCount,
    if (cancelAtCycleEnd) 'cancelAtCycleEnd': cancelAtCycleEnd,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };

  UserSubscription copyWith({
    SubscriptionStatus? status,
    SubscriptionProductSnapshot? product,
    DateTime? currentPeriodStart,
    DateTime? currentPeriodEnd,
    DateTime? nextChargeAt,
    int? paidCount,
    int? remainingCount,
    bool? cancelAtCycleEnd,
  }) {
    return UserSubscription(
      id: id,
      appId: appId,
      enrollmentTransactionId: enrollmentTransactionId,
      product: product ?? this.product,
      subscriptionId: subscriptionId,
      planId: planId,
      status: status ?? this.status,
      amount: amount,
      currentPeriodStart: currentPeriodStart ?? this.currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd ?? this.currentPeriodEnd,
      nextChargeAt: nextChargeAt ?? this.nextChargeAt,
      paidCount: paidCount ?? this.paidCount,
      totalCount: totalCount,
      remainingCount: remainingCount ?? this.remainingCount,
      cancelAtCycleEnd: cancelAtCycleEnd ?? this.cancelAtCycleEnd,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
