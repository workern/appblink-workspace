import { Base } from '../common';

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

export interface FirebasePricingRecommendation {
  estimatedCostUsdPerUser: number;
  suggestedPriceUsdPerUser: number;
  suggestedFloorUsdPerUser: number;
  grossMarginPctAtSuggestedPrice: number;
}

export interface FirebaseUsageUserSummary<T = Date>
  extends Base<T>, FirebaseUsageMetrics {
  appId: string;
  monthKey: string;
  cost: FirebaseCostBreakdown;
  pricing: FirebasePricingRecommendation;
  functionCallsByName?: Record<string, number>;
}
