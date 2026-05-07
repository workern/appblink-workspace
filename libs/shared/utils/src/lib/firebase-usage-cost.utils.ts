export interface FirebaseUsageMetrics {
  firestoreReads: number;
  firestoreCreates: number;
  firestoreUpdates: number;
  firestoreDeletes: number;
  firestoreBandwidthBytes: number;
  functionsCalls: number;
  functionsBandwidthBytes: number;
  functionsExecutionMs: number;
  storageUploads: number;
  storageDownloads: number;
  storageDeletes: number;
  storageUploadBytes: number;
  storageDownloadBytes: number;
}

export interface FirebaseUsageEvent {
  metrics: Partial<FirebaseUsageMetrics>;
  atMs?: number;
}

export interface FirebaseBlazePricingConfig {
  firestoreReadPer100kUsd: number;
  firestoreWritePer100kUsd: number;
  firestoreDeletePer100kUsd: number;
  firestoreNetworkPerGbUsd: number;
  functionsInvocationPerMillionUsd: number;
  functionsNetworkPerGbUsd: number;
  functionsGbSecondUsd: number;
  functionsCpuSecondUsd: number;
  functionsMemoryGbPerInvocationSecond: number;
  functionsCpuPerInvocationSecond: number;
  storageUploadOperationPer10kUsd: number;
  storageDownloadOperationPer10kUsd: number;
  storageNetworkPerGbUsd: number;
  monthlyFreeTier: {
    firestoreReads: number;
    firestoreWrites: number;
    firestoreDeletes: number;
    firestoreNetworkGb: number;
    functionsInvocations: number;
    functionsNetworkGb: number;
    functionsGbSeconds: number;
    functionsCpuSeconds: number;
    storageUploads: number;
    storageDownloads: number;
    storageDownloadGb: number;
  };
  pricingModel: {
    targetGrossMarginPct: number;
    platformFeeUsd: number;
    safetyMultiplier: number;
  };
}

export interface FirebaseCostBreakdown {
  firestoreReadsUsd: number;
  firestoreWritesUsd: number;
  firestoreDeletesUsd: number;
  firestoreNetworkUsd: number;
  functionsInvocationsUsd: number;
  functionsNetworkUsd: number;
  functionsGbSecondsUsd: number;
  functionsCpuSecondsUsd: number;
  storageUploadsUsd: number;
  storageDownloadsUsd: number;
  storageNetworkUsd: number;
  totalUsd: number;
}

export interface FirebasePricingSuggestion {
  estimatedCostUsdPerUser: number;
  suggestedPriceUsdPerUser: number;
  suggestedFloorUsdPerUser: number;
  grossMarginPctAtSuggestedPrice: number;
}

const ONE_GB_IN_BYTES = 1024 * 1024 * 1024;

export const DEFAULT_FIREBASE_BLAZE_PRICING: FirebaseBlazePricingConfig = {
  // Firestore rates vary by location; keep these overridable from backend config.
  firestoreReadPer100kUsd: 0.06,
  firestoreWritePer100kUsd: 0.18,
  firestoreDeletePer100kUsd: 0.02,
  firestoreNetworkPerGbUsd: 0.12,
  functionsInvocationPerMillionUsd: 0.4,
  functionsNetworkPerGbUsd: 0.12,
  // Region specific. Set exact values from backend config for production billing.
  functionsGbSecondUsd: 0,
  functionsCpuSecondUsd: 0,
  // Reasonable defaults for estimation when per-function resource metadata is unknown.
  functionsMemoryGbPerInvocationSecond: 0.25,
  functionsCpuPerInvocationSecond: 1,
  storageUploadOperationPer10kUsd: 0.05,
  storageDownloadOperationPer10kUsd: 0.004,
  storageNetworkPerGbUsd: 0.12,
  // Spark-equivalent free tier included in Blaze, normalized monthly.
  monthlyFreeTier: {
    firestoreReads: 50_000 * 30,
    firestoreWrites: 20_000 * 30,
    firestoreDeletes: 20_000 * 30,
    firestoreNetworkGb: 10,
    functionsInvocations: 2_000_000,
    functionsNetworkGb: 5,
    functionsGbSeconds: 400_000,
    functionsCpuSeconds: 200_000,
    storageUploads: 20_000 * 30,
    storageDownloads: 50_000 * 30,
    storageDownloadGb: 1 * 30
  },
  pricingModel: {
    targetGrossMarginPct: 0.75,
    platformFeeUsd: 0.1,
    safetyMultiplier: 1.2
  }
};

export class FirebaseUsageTrackerEngine {
  private metrics: FirebaseUsageMetrics = {
    firestoreReads: 0,
    firestoreCreates: 0,
    firestoreUpdates: 0,
    firestoreDeletes: 0,
    firestoreBandwidthBytes: 0,
    functionsCalls: 0,
    functionsBandwidthBytes: 0,
    functionsExecutionMs: 0,
    storageUploads: 0,
    storageDownloads: 0,
    storageDeletes: 0,
    storageUploadBytes: 0,
    storageDownloadBytes: 0
  };

  constructor(initial?: Partial<FirebaseUsageMetrics>) {
    if (initial) {
      this.addMetrics(initial);
    }
  }

  record(event: FirebaseUsageEvent): void {
    this.addMetrics(event.metrics);
  }

  recordFirestoreRead(docCount = 1, bytes = 0): void {
    this.addMetrics({
      firestoreReads: Math.max(0, docCount),
      firestoreBandwidthBytes: Math.max(0, bytes)
    });
  }

  recordFirestoreCreate(docCount = 1, bytes = 0): void {
    this.addMetrics({
      firestoreCreates: Math.max(0, docCount),
      firestoreBandwidthBytes: Math.max(0, bytes)
    });
  }

  recordFirestoreUpdate(docCount = 1, bytes = 0): void {
    this.addMetrics({
      firestoreUpdates: Math.max(0, docCount),
      firestoreBandwidthBytes: Math.max(0, bytes)
    });
  }

  recordFirestoreDelete(docCount = 1): void {
    this.addMetrics({ firestoreDeletes: Math.max(0, docCount) });
  }

  recordFunctionCall(callCount = 1, bytes = 0): void {
    this.addMetrics({
      functionsCalls: Math.max(0, callCount),
      functionsBandwidthBytes: Math.max(0, bytes)
    });
  }

  recordFunctionExecution(executionMs = 0): void {
    this.addMetrics({
      functionsExecutionMs: Math.max(0, executionMs)
    });
  }

  recordStorageUpload(operationCount = 1, bytes = 0): void {
    this.addMetrics({
      storageUploads: Math.max(0, operationCount),
      storageUploadBytes: Math.max(0, bytes)
    });
  }

  recordStorageDownload(operationCount = 1, bytes = 0): void {
    this.addMetrics({
      storageDownloads: Math.max(0, operationCount),
      storageDownloadBytes: Math.max(0, bytes)
    });
  }

  recordStorageDelete(operationCount = 1): void {
    this.addMetrics({
      storageDeletes: Math.max(0, operationCount)
    });
  }

  snapshot(): FirebaseUsageMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      firestoreReads: 0,
      firestoreCreates: 0,
      firestoreUpdates: 0,
      firestoreDeletes: 0,
      firestoreBandwidthBytes: 0,
      functionsCalls: 0,
      functionsBandwidthBytes: 0,
      functionsExecutionMs: 0,
      storageUploads: 0,
      storageDownloads: 0,
      storageDeletes: 0,
      storageUploadBytes: 0,
      storageDownloadBytes: 0
    };
  }

  drain(): FirebaseUsageMetrics {
    const copy = this.snapshot();
    this.reset();
    return copy;
  }

  private addMetrics(metrics: Partial<FirebaseUsageMetrics>): void {
    this.metrics.firestoreReads += metrics.firestoreReads ?? 0;
    this.metrics.firestoreCreates += metrics.firestoreCreates ?? 0;
    this.metrics.firestoreUpdates += metrics.firestoreUpdates ?? 0;
    this.metrics.firestoreDeletes += metrics.firestoreDeletes ?? 0;
    this.metrics.firestoreBandwidthBytes +=
      metrics.firestoreBandwidthBytes ?? 0;
    this.metrics.functionsCalls += metrics.functionsCalls ?? 0;
    this.metrics.functionsBandwidthBytes +=
      metrics.functionsBandwidthBytes ?? 0;
    this.metrics.functionsExecutionMs += metrics.functionsExecutionMs ?? 0;
    this.metrics.storageUploads += metrics.storageUploads ?? 0;
    this.metrics.storageDownloads += metrics.storageDownloads ?? 0;
    this.metrics.storageDeletes += metrics.storageDeletes ?? 0;
    this.metrics.storageUploadBytes += metrics.storageUploadBytes ?? 0;
    this.metrics.storageDownloadBytes += metrics.storageDownloadBytes ?? 0;
  }
}

export function estimateFirebaseCostForUsage(
  usage: FirebaseUsageMetrics,
  pricing: FirebaseBlazePricingConfig,
  activeUsersInPeriod: number
): FirebaseCostBreakdown {
  const safeUsers = Math.max(1, activeUsersInPeriod);
  const freeReads = pricing.monthlyFreeTier.firestoreReads / safeUsers;
  const freeWrites = pricing.monthlyFreeTier.firestoreWrites / safeUsers;
  const freeDeletes = pricing.monthlyFreeTier.firestoreDeletes / safeUsers;
  const freeFirestoreNetworkBytes =
    (pricing.monthlyFreeTier.firestoreNetworkGb * ONE_GB_IN_BYTES) / safeUsers;
  const freeFunctionCalls =
    pricing.monthlyFreeTier.functionsInvocations / safeUsers;
  const freeFunctionNetworkBytes =
    (pricing.monthlyFreeTier.functionsNetworkGb * ONE_GB_IN_BYTES) / safeUsers;
  const freeFunctionGbSeconds =
    pricing.monthlyFreeTier.functionsGbSeconds / safeUsers;
  const freeFunctionCpuSeconds =
    pricing.monthlyFreeTier.functionsCpuSeconds / safeUsers;
  const freeStorageUploads = pricing.monthlyFreeTier.storageUploads / safeUsers;
  const freeStorageDownloads =
    pricing.monthlyFreeTier.storageDownloads / safeUsers;
  const freeStorageDownloadBytes =
    (pricing.monthlyFreeTier.storageDownloadGb * ONE_GB_IN_BYTES) / safeUsers;

  const billableReads = Math.max(0, usage.firestoreReads - freeReads);
  const billableWrites = Math.max(
    0,
    usage.firestoreCreates + usage.firestoreUpdates - freeWrites
  );
  const billableDeletes = Math.max(0, usage.firestoreDeletes - freeDeletes);
  const billableFirestoreNetworkBytes = Math.max(
    0,
    usage.firestoreBandwidthBytes - freeFirestoreNetworkBytes
  );
  const billableFunctionCalls = Math.max(
    0,
    usage.functionsCalls - freeFunctionCalls
  );
  const billableFunctionNetworkBytes = Math.max(
    0,
    usage.functionsBandwidthBytes - freeFunctionNetworkBytes
  );
  const functionExecutionSeconds =
    Math.max(0, usage.functionsExecutionMs) / 1000;
  const billableFunctionGbSeconds = Math.max(
    0,
    functionExecutionSeconds * pricing.functionsMemoryGbPerInvocationSecond -
      freeFunctionGbSeconds
  );
  const billableFunctionCpuSeconds = Math.max(
    0,
    functionExecutionSeconds * pricing.functionsCpuPerInvocationSecond -
      freeFunctionCpuSeconds
  );
  const billableStorageUploads = Math.max(
    0,
    usage.storageUploads - freeStorageUploads
  );
  const billableStorageDownloads = Math.max(
    0,
    usage.storageDownloads - freeStorageDownloads
  );
  const billableStorageDownloadBytes = Math.max(
    0,
    usage.storageDownloadBytes - freeStorageDownloadBytes
  );

  const firestoreReadsUsd =
    (billableReads / 100_000) * pricing.firestoreReadPer100kUsd;
  const firestoreWritesUsd =
    (billableWrites / 100_000) * pricing.firestoreWritePer100kUsd;
  const firestoreDeletesUsd =
    (billableDeletes / 100_000) * pricing.firestoreDeletePer100kUsd;
  const firestoreNetworkUsd =
    (billableFirestoreNetworkBytes / ONE_GB_IN_BYTES) *
    pricing.firestoreNetworkPerGbUsd;
  const functionsInvocationsUsd =
    (billableFunctionCalls / 1_000_000) *
    pricing.functionsInvocationPerMillionUsd;
  const functionsNetworkUsd =
    (billableFunctionNetworkBytes / ONE_GB_IN_BYTES) *
    pricing.functionsNetworkPerGbUsd;
  const functionsGbSecondsUsd =
    billableFunctionGbSeconds * pricing.functionsGbSecondUsd;
  const functionsCpuSecondsUsd =
    billableFunctionCpuSeconds * pricing.functionsCpuSecondUsd;
  const storageUploadsUsd =
    (billableStorageUploads / 10_000) * pricing.storageUploadOperationPer10kUsd;
  const storageDownloadsUsd =
    (billableStorageDownloads / 10_000) *
    pricing.storageDownloadOperationPer10kUsd;
  const storageNetworkUsd =
    (billableStorageDownloadBytes / ONE_GB_IN_BYTES) *
    pricing.storageNetworkPerGbUsd;

  const totalUsd =
    firestoreReadsUsd +
    firestoreWritesUsd +
    firestoreDeletesUsd +
    firestoreNetworkUsd +
    functionsInvocationsUsd +
    functionsNetworkUsd +
    functionsGbSecondsUsd +
    functionsCpuSecondsUsd +
    storageUploadsUsd +
    storageDownloadsUsd +
    storageNetworkUsd;

  return {
    firestoreReadsUsd,
    firestoreWritesUsd,
    firestoreDeletesUsd,
    firestoreNetworkUsd,
    functionsInvocationsUsd,
    functionsNetworkUsd,
    functionsGbSecondsUsd,
    functionsCpuSecondsUsd,
    storageUploadsUsd,
    storageDownloadsUsd,
    storageNetworkUsd,
    totalUsd
  };
}

export function suggestPricingFromCost(
  estimatedCostUsdPerUser: number,
  pricing: FirebaseBlazePricingConfig
): FirebasePricingSuggestion {
  const safeCost = Math.max(0, estimatedCostUsdPerUser);
  const grossMarginFactor =
    1 / Math.max(0.01, 1 - pricing.pricingModel.targetGrossMarginPct);

  const floor =
    (safeCost + pricing.pricingModel.platformFeeUsd) *
    pricing.pricingModel.safetyMultiplier;
  const suggested = floor * grossMarginFactor;
  const margin = suggested <= 0 ? 0 : (suggested - safeCost) / suggested;

  return {
    estimatedCostUsdPerUser: safeCost,
    suggestedPriceUsdPerUser: suggested,
    suggestedFloorUsdPerUser: floor,
    grossMarginPctAtSuggestedPrice: margin
  };
}
