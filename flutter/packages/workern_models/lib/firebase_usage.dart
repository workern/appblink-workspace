import 'base.dart';

class FirebaseUsageMetrics {
  final int firestoreReads;
  final int firestoreCreates;
  final int firestoreUpdates;
  final int firestoreDeletes;
  final int firestoreBandwidthBytes;
  final int functionsCalls;
  final int functionsBandwidthBytes;
  final int functionsExecutionMs;
  final int storageUploads;
  final int storageDownloads;
  final int storageDeletes;
  final int storageUploadBytes;
  final int storageDownloadBytes;

  const FirebaseUsageMetrics({
    this.firestoreReads = 0,
    this.firestoreCreates = 0,
    this.firestoreUpdates = 0,
    this.firestoreDeletes = 0,
    this.firestoreBandwidthBytes = 0,
    this.functionsCalls = 0,
    this.functionsBandwidthBytes = 0,
    this.functionsExecutionMs = 0,
    this.storageUploads = 0,
    this.storageDownloads = 0,
    this.storageDeletes = 0,
    this.storageUploadBytes = 0,
    this.storageDownloadBytes = 0,
  });

  factory FirebaseUsageMetrics.fromJson(Map<String, dynamic> json) {
    return FirebaseUsageMetrics(
      firestoreReads: (json['firestoreReads'] ?? 0) as int,
      firestoreCreates: (json['firestoreCreates'] ?? 0) as int,
      firestoreUpdates: (json['firestoreUpdates'] ?? 0) as int,
      firestoreDeletes: (json['firestoreDeletes'] ?? 0) as int,
      firestoreBandwidthBytes: (json['firestoreBandwidthBytes'] ?? 0) as int,
      functionsCalls: (json['functionsCalls'] ?? 0) as int,
      functionsBandwidthBytes: (json['functionsBandwidthBytes'] ?? 0) as int,
      functionsExecutionMs: (json['functionsExecutionMs'] ?? 0) as int,
      storageUploads: (json['storageUploads'] ?? 0) as int,
      storageDownloads: (json['storageDownloads'] ?? 0) as int,
      storageDeletes: (json['storageDeletes'] ?? 0) as int,
      storageUploadBytes: (json['storageUploadBytes'] ?? 0) as int,
      storageDownloadBytes: (json['storageDownloadBytes'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firestoreReads': firestoreReads,
      'firestoreCreates': firestoreCreates,
      'firestoreUpdates': firestoreUpdates,
      'firestoreDeletes': firestoreDeletes,
      'firestoreBandwidthBytes': firestoreBandwidthBytes,
      'functionsCalls': functionsCalls,
      'functionsBandwidthBytes': functionsBandwidthBytes,
      'functionsExecutionMs': functionsExecutionMs,
      'storageUploads': storageUploads,
      'storageDownloads': storageDownloads,
      'storageDeletes': storageDeletes,
      'storageUploadBytes': storageUploadBytes,
      'storageDownloadBytes': storageDownloadBytes,
    };
  }
}

class FirebaseCostBreakdown {
  final double firestoreReadsUsd;
  final double firestoreWritesUsd;
  final double firestoreDeletesUsd;
  final double firestoreNetworkUsd;
  final double functionsInvocationsUsd;
  final double functionsNetworkUsd;
  final double functionsGbSecondsUsd;
  final double functionsCpuSecondsUsd;
  final double storageUploadsUsd;
  final double storageDownloadsUsd;
  final double storageNetworkUsd;
  final double totalUsd;

  const FirebaseCostBreakdown({
    this.firestoreReadsUsd = 0,
    this.firestoreWritesUsd = 0,
    this.firestoreDeletesUsd = 0,
    this.firestoreNetworkUsd = 0,
    this.functionsInvocationsUsd = 0,
    this.functionsNetworkUsd = 0,
    this.functionsGbSecondsUsd = 0,
    this.functionsCpuSecondsUsd = 0,
    this.storageUploadsUsd = 0,
    this.storageDownloadsUsd = 0,
    this.storageNetworkUsd = 0,
    this.totalUsd = 0,
  });

  factory FirebaseCostBreakdown.fromJson(Map<String, dynamic> json) {
    double _toDouble(dynamic value) => (value ?? 0).toDouble();
    return FirebaseCostBreakdown(
      firestoreReadsUsd: _toDouble(json['firestoreReadsUsd']),
      firestoreWritesUsd: _toDouble(json['firestoreWritesUsd']),
      firestoreDeletesUsd: _toDouble(json['firestoreDeletesUsd']),
      firestoreNetworkUsd: _toDouble(json['firestoreNetworkUsd']),
      functionsInvocationsUsd: _toDouble(json['functionsInvocationsUsd']),
      functionsNetworkUsd: _toDouble(json['functionsNetworkUsd']),
      functionsGbSecondsUsd: _toDouble(json['functionsGbSecondsUsd']),
      functionsCpuSecondsUsd: _toDouble(json['functionsCpuSecondsUsd']),
      storageUploadsUsd: _toDouble(json['storageUploadsUsd']),
      storageDownloadsUsd: _toDouble(json['storageDownloadsUsd']),
      storageNetworkUsd: _toDouble(json['storageNetworkUsd']),
      totalUsd: _toDouble(json['totalUsd']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firestoreReadsUsd': firestoreReadsUsd,
      'firestoreWritesUsd': firestoreWritesUsd,
      'firestoreDeletesUsd': firestoreDeletesUsd,
      'firestoreNetworkUsd': firestoreNetworkUsd,
      'functionsInvocationsUsd': functionsInvocationsUsd,
      'functionsNetworkUsd': functionsNetworkUsd,
      'functionsGbSecondsUsd': functionsGbSecondsUsd,
      'functionsCpuSecondsUsd': functionsCpuSecondsUsd,
      'storageUploadsUsd': storageUploadsUsd,
      'storageDownloadsUsd': storageDownloadsUsd,
      'storageNetworkUsd': storageNetworkUsd,
      'totalUsd': totalUsd,
    };
  }
}

class FirebasePricingRecommendation {
  final double estimatedCostUsdPerUser;
  final double suggestedPriceUsdPerUser;
  final double suggestedFloorUsdPerUser;
  final double grossMarginPctAtSuggestedPrice;

  const FirebasePricingRecommendation({
    this.estimatedCostUsdPerUser = 0,
    this.suggestedPriceUsdPerUser = 0,
    this.suggestedFloorUsdPerUser = 0,
    this.grossMarginPctAtSuggestedPrice = 0,
  });

  factory FirebasePricingRecommendation.fromJson(Map<String, dynamic> json) {
    double _toDouble(dynamic value) => (value ?? 0).toDouble();
    return FirebasePricingRecommendation(
      estimatedCostUsdPerUser: _toDouble(json['estimatedCostUsdPerUser']),
      suggestedPriceUsdPerUser: _toDouble(json['suggestedPriceUsdPerUser']),
      suggestedFloorUsdPerUser: _toDouble(json['suggestedFloorUsdPerUser']),
      grossMarginPctAtSuggestedPrice: _toDouble(
        json['grossMarginPctAtSuggestedPrice'],
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'estimatedCostUsdPerUser': estimatedCostUsdPerUser,
      'suggestedPriceUsdPerUser': suggestedPriceUsdPerUser,
      'suggestedFloorUsdPerUser': suggestedFloorUsdPerUser,
      'grossMarginPctAtSuggestedPrice': grossMarginPctAtSuggestedPrice,
    };
  }
}

class FirebaseUsageUserSummary extends Base {
  final String appId;
  final String monthKey;
  final FirebaseUsageMetrics metrics;
  final FirebaseCostBreakdown cost;
  final FirebasePricingRecommendation pricing;
  final Map<String, int>? functionCallsByName;

  FirebaseUsageUserSummary({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.appId,
    required this.monthKey,
    required this.metrics,
    required this.cost,
    required this.pricing,
    this.functionCallsByName,
  });

  factory FirebaseUsageUserSummary.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);
    return FirebaseUsageUserSummary(
      id: (base['id'] ?? '') as String,
      createdAt: base['createdAt'] as DateTime,
      updatedAt: base['updatedAt'] as DateTime,
      owner: base['owner'] as BaseOwner,
      space: base['space'] as BaseSpace,
      appId: (json['appId'] ?? '') as String,
      monthKey: (json['monthKey'] ?? '') as String,
      metrics: FirebaseUsageMetrics.fromJson(
        (json['metrics'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      cost: FirebaseCostBreakdown.fromJson(
        (json['cost'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      pricing: FirebasePricingRecommendation.fromJson(
        (json['pricing'] ?? <String, dynamic>{}) as Map<String, dynamic>,
      ),
      functionCallsByName:
          (json['functionCallsByName'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, (v ?? 0) as int),
          ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      ...baseToJson(),
      'appId': appId,
      'monthKey': monthKey,
      'metrics': metrics.toJson(),
      'cost': cost.toJson(),
      'pricing': pricing.toJson(),
      'functionCallsByName': functionCallsByName,
    };
  }
}
