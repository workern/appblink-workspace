import 'package:cloud_firestore/cloud_firestore.dart';

enum RewardType {
  referralSignup,
  referralPurchase,
  referralBonus,
  custom,
}

enum RewardStatus {
  pending,
  claimed,
  expired,
}

class ReferralReward {
  final String id;
  final String userId;
  final RewardType type;
  final int amount;
  final String currency;
  final RewardStatus status;
  final String? referralId;
  final String? referredUserId;
  final String? description;
  final DateTime? createdAt;
  final DateTime? claimedAt;
  final DateTime? expiresAt;
  final Map<String, dynamic>? metadata;

  const ReferralReward({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.currency,
    this.status = RewardStatus.pending,
    this.referralId,
    this.referredUserId,
    this.description,
    this.createdAt,
    this.claimedAt,
    this.expiresAt,
    this.metadata,
  });

  factory ReferralReward.fromJson(Map<String, dynamic> json) => ReferralReward(
        id: json['id'] as String,
        userId: json['userId'] as String,
        type: RewardType.values.firstWhere((e) => e.name == json['type'],
            orElse: () => RewardType.custom),
        amount: json['amount'] as int,
        currency: json['currency'] as String,
        status: RewardStatus.values.firstWhere((e) => e.name == json['status'],
            orElse: () => RewardStatus.pending),
        referralId: json['referralId'] as String?,
        referredUserId: json['referredUserId'] as String?,
        description: json['description'] as String?,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
        claimedAt: json['claimedAt'] != null
            ? DateTime.parse(json['claimedAt'] as String)
            : null,
        expiresAt: json['expiresAt'] != null
            ? DateTime.parse(json['expiresAt'] as String)
            : null,
        metadata: json['metadata'] as Map<String, dynamic>?,
      );

  factory ReferralReward.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReferralReward(
      id: doc.id,
      userId: data['userId'] ?? '',
      type: RewardType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => RewardType.custom,
      ),
      amount: data['amount'] ?? 0,
      currency: data['currency'] ?? 'credits',
      status: RewardStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => RewardStatus.pending,
      ),
      referralId: data['referralId'],
      referredUserId: data['referredUserId'],
      description: data['description'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
      claimedAt: (data['claimedAt'] as Timestamp?)?.toDate(),
      expiresAt: (data['expiresAt'] as Timestamp?)?.toDate(),
      metadata: data['metadata'] != null
          ? Map<String, dynamic>.from(data['metadata'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.name,
        'amount': amount,
        'currency': currency,
        'status': status.name,
        if (referralId != null) 'referralId': referralId,
        if (referredUserId != null) 'referredUserId': referredUserId,
        if (description != null) 'description': description,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (claimedAt != null) 'claimedAt': claimedAt!.toIso8601String(),
        if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String(),
        if (metadata != null) 'metadata': metadata,
      };

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'type': type.name,
      'amount': amount,
      'currency': currency,
      'status': status.name,
      if (referralId != null) 'referralId': referralId,
      if (referredUserId != null) 'referredUserId': referredUserId,
      if (description != null) 'description': description,
      'createdAt': createdAt != null
          ? Timestamp.fromDate(createdAt!)
          : FieldValue.serverTimestamp(),
      if (claimedAt != null) 'claimedAt': Timestamp.fromDate(claimedAt!),
      if (expiresAt != null) 'expiresAt': Timestamp.fromDate(expiresAt!),
      if (metadata != null) 'metadata': metadata,
    };
  }

  ReferralReward copyWith({
    String? id,
    String? userId,
    RewardType? type,
    int? amount,
    String? currency,
    RewardStatus? status,
    String? referralId,
    String? referredUserId,
    String? description,
    DateTime? createdAt,
    DateTime? claimedAt,
    DateTime? expiresAt,
    Map<String, dynamic>? metadata,
  }) =>
      ReferralReward(
        id: id ?? this.id,
        userId: userId ?? this.userId,
        type: type ?? this.type,
        amount: amount ?? this.amount,
        currency: currency ?? this.currency,
        status: status ?? this.status,
        referralId: referralId ?? this.referralId,
        referredUserId: referredUserId ?? this.referredUserId,
        description: description ?? this.description,
        createdAt: createdAt ?? this.createdAt,
        claimedAt: claimedAt ?? this.claimedAt,
        expiresAt: expiresAt ?? this.expiresAt,
        metadata: metadata ?? this.metadata,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReferralReward &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userId == other.userId &&
          type == other.type &&
          amount == other.amount &&
          currency == other.currency &&
          status == other.status;

  @override
  int get hashCode =>
      Object.hash(id, userId, type, amount, currency, status);

  @override
  String toString() =>
      'ReferralReward(id: $id, userId: $userId, type: $type, amount: $amount, currency: $currency, status: $status)';
}

