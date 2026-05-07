import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import {
  db,
  deployOptions,
  firestoreIncrement,
  firestoreWriteTimestamp
} from './global';
import {
  DEFAULT_FIREBASE_BLAZE_PRICING,
  estimateFirebaseCostForUsage,
  suggestPricingFromCost,
  type FirebaseUsageMetrics
} from '../../../../libs/shared/utils/src/lib/firebase-usage-cost.utils';

const reportUsageSchema = z.object({
  appId: z.string().min(1),
  source: z.string().optional(),
  metrics: z.object({
    firestoreReads: z.number().int().min(0).default(0),
    firestoreCreates: z.number().int().min(0).default(0),
    firestoreUpdates: z.number().int().min(0).default(0),
    firestoreDeletes: z.number().int().min(0).default(0),
    firestoreBandwidthBytes: z.number().int().min(0).default(0),
    functionsCalls: z.number().int().min(0).default(0),
    functionsBandwidthBytes: z.number().int().min(0).default(0),
    functionsExecutionMs: z.number().int().min(0).default(0),
    storageUploads: z.number().int().min(0).default(0),
    storageDownloads: z.number().int().min(0).default(0),
    storageDeletes: z.number().int().min(0).default(0),
    storageUploadBytes: z.number().int().min(0).default(0),
    storageDownloadBytes: z.number().int().min(0).default(0)
  }),
  functionCallsByName: z.record(z.string(), z.number().int().min(0)).optional(),
  entityBreakdown: z
    .record(
      z.string(),
      z.object({
        reads: z.number().int().min(0).optional(),
        creates: z.number().int().min(0).optional(),
        updates: z.number().int().min(0).optional(),
        deletes: z.number().int().min(0).optional()
      })
    )
    .optional()
});

const getDashboardSchema = z.object({
  appId: z.string().min(1),
  monthKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  lookbackMonths: z.number().int().min(1).max(24).default(6)
});

function getMonthKey(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

function getDayKey(date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeKey(input?: string): string | undefined {
  if (!input) return undefined;
  return input.replace(/[./#$\[\]]/g, '_').toLowerCase();
}

// ─── Backend usage recorder ───────────────────────────────────────────────────

export interface EntityOps {
  reads?: number;
  creates?: number;
  updates?: number;
  deletes?: number;
}

export interface BackendUsageMetrics {
  firestoreReads?: number;
  firestoreCreates?: number;
  firestoreUpdates?: number;
  firestoreDeletes?: number;
  storageUploads?: number;
  storageDownloads?: number;
  storageDeletes?: number;
  storageUploadBytes?: number;
  storageDownloadBytes?: number;
  entityBreakdown?: Record<string, EntityOps>;
}

export async function recordBackendUsage(
  appId: string,
  uid: string,
  fnName: string,
  metrics: BackendUsageMetrics
): Promise<void> {
  try {
    const now = new Date();
    const dayKey = getDayKey(now);
    const monthKey = getMonthKey(now);
    const safeFn = sanitizeKey(fnName) ?? 'unknown';

    const monthSummaryRef = db.doc(
      `apps/${appId}/applicationUsages/firebase/months/${monthKey}/summary`
    );
    const monthUserRef = db.doc(
      `apps/${appId}/applicationUsages/firebase/months/${monthKey}/users/${uid}`
    );
    const monthUserPersonalRef = db.doc(
      `users/${uid}/mySpaces/${appId}/applicationUsages/firebase/${monthKey}`
    );

    const reads = metrics.firestoreReads ?? 0;
    const creates = metrics.firestoreCreates ?? 0;
    const updates = metrics.firestoreUpdates ?? 0;
    const deletes = metrics.firestoreDeletes ?? 0;
    const storageUploads = metrics.storageUploads ?? 0;
    const storageDownloads = metrics.storageDownloads ?? 0;
    const storageDeletes = metrics.storageDeletes ?? 0;
    const storageUploadBytes = metrics.storageUploadBytes ?? 0;
    const storageDownloadBytes = metrics.storageDownloadBytes ?? 0;

    const entityIncrements: Record<
      string,
      ReturnType<typeof firestoreIncrement>
    > = {};
    if (metrics.entityBreakdown) {
      for (const [rawEntity, ops] of Object.entries(metrics.entityBreakdown)) {
        const safeEntity = rawEntity.replace(/[./#$\[\]]/g, '_').toLowerCase();
        if (ops.reads)
          entityIncrements[`entityOps.${safeEntity}.reads`] =
            firestoreIncrement(ops.reads);
        if (ops.creates)
          entityIncrements[`entityOps.${safeEntity}.creates`] =
            firestoreIncrement(ops.creates);
        if (ops.updates)
          entityIncrements[`entityOps.${safeEntity}.updates`] =
            firestoreIncrement(ops.updates);
        if (ops.deletes)
          entityIncrements[`entityOps.${safeEntity}.deletes`] =
            firestoreIncrement(ops.deletes);
      }
    }

    const userIncrement = {
      'metrics.firestoreReads': firestoreIncrement(reads),
      'metrics.firestoreCreates': firestoreIncrement(creates),
      'metrics.firestoreUpdates': firestoreIncrement(updates),
      'metrics.firestoreDeletes': firestoreIncrement(deletes),
      'metrics.storageUploads': firestoreIncrement(storageUploads),
      'metrics.storageDownloads': firestoreIncrement(storageDownloads),
      'metrics.storageDeletes': firestoreIncrement(storageDeletes),
      'metrics.storageUploadBytes': firestoreIncrement(storageUploadBytes),
      'metrics.storageDownloadBytes': firestoreIncrement(storageDownloadBytes),
      [`functionCallsByName.${safeFn}`]: firestoreIncrement(1),
      ...entityIncrements,
      updatedAt: now
    };

    const summaryIncrement = {
      'totals.firestoreReads': firestoreIncrement(reads),
      'totals.firestoreCreates': firestoreIncrement(creates),
      'totals.firestoreUpdates': firestoreIncrement(updates),
      'totals.firestoreDeletes': firestoreIncrement(deletes),
      'totals.storageUploads': firestoreIncrement(storageUploads),
      'totals.storageDownloads': firestoreIncrement(storageDownloads),
      'totals.storageDeletes': firestoreIncrement(storageDeletes),
      'totals.storageUploadBytes': firestoreIncrement(storageUploadBytes),
      'totals.storageDownloadBytes': firestoreIncrement(storageDownloadBytes),
      ...entityIncrements,
      updatedAt: now
    };

    const dashUserRef = db.doc(
      `apps/${appId}/applicationUsage/monthly/periods/${monthKey}/users/${uid}`
    );
    const dashDailyUserRef = db.doc(
      `apps/${appId}/applicationUsage/daily/periods/${dayKey}/users/${uid}`
    );
    const dashUserIncrement = {
      'metrics.firestoreReads': firestoreIncrement(reads),
      'metrics.firestoreCreates': firestoreIncrement(creates),
      'metrics.firestoreUpdates': firestoreIncrement(updates),
      'metrics.firestoreDeletes': firestoreIncrement(deletes),
      'metrics.storageUploads': firestoreIncrement(storageUploads),
      'metrics.storageDownloads': firestoreIncrement(storageDownloads),
      'metrics.storageDeletes': firestoreIncrement(storageDeletes),
      'metrics.storageUploadBytes': firestoreIncrement(storageUploadBytes),
      'metrics.storageDownloadBytes': firestoreIncrement(storageDownloadBytes),
      [`functionCallsByName.${safeFn}`]: firestoreIncrement(1),
      ...entityIncrements,
      updatedAt: now
    };

    await Promise.all([
      monthUserRef.set(userIncrement, { merge: true }),
      monthUserPersonalRef.set(
        { ...userIncrement, appId, monthKey },
        { merge: true }
      ),
      monthSummaryRef.set(summaryIncrement, { merge: true }),
      dashUserRef.set(dashUserIncrement, { merge: true }),
      dashDailyUserRef.set(dashUserIncrement, { merge: true })
    ]);
  } catch (err) {
    logger.warn('[recordBackendUsage] failed to record usage', {
      appId,
      fnName,
      err
    });
  }
}

type UsagePeriodType = 'daily' | 'monthly';

const DAILY_PERIOD_TYPE: UsagePeriodType = 'daily';
const MONTHLY_PERIOD_TYPE: UsagePeriodType = 'monthly';

function buildPeriodUserRef(
  appId: string,
  periodType: UsagePeriodType,
  periodKey: string,
  uid: string
) {
  return db.doc(
    `apps/${appId}/applicationUsage/${periodType}/periods/${periodKey}/users/${uid}`
  );
}

function buildPeriodUsersCollection(
  appId: string,
  periodType: UsagePeriodType,
  periodKey: string
) {
  return db.collection(
    `apps/${appId}/applicationUsage/${periodType}/periods/${periodKey}/users`
  );
}

function buildPeriodSummaryRef(
  appId: string,
  periodType: UsagePeriodType,
  periodKey: string
) {
  return db.doc(
    `apps/${appId}/applicationUsage/${periodType}/periods/${periodKey}/summary/aggregate`
  );
}

function buildUsageRef(appId: string, monthKey: string, uid: string) {
  return buildPeriodUserRef(appId, MONTHLY_PERIOD_TYPE, monthKey, uid);
}

function buildMonthCollection(appId: string, monthKey: string) {
  return buildPeriodUsersCollection(appId, MONTHLY_PERIOD_TYPE, monthKey);
}

function buildSummaryRef(appId: string, monthKey: string) {
  return buildPeriodSummaryRef(appId, MONTHLY_PERIOD_TYPE, monthKey);
}

function mergeFunctionCallCounts(
  existingFunctionCalls: Record<string, number> | undefined,
  incomingFunctionCalls: Record<string, number> | undefined
) {
  const merged = {
    ...(existingFunctionCalls ?? {}),
    ...(incomingFunctionCalls ?? {})
  } as Record<string, number>;

  if (!incomingFunctionCalls) {
    return merged;
  }

  for (const [fnName, count] of Object.entries(incomingFunctionCalls)) {
    merged[fnName] = (existingFunctionCalls?.[fnName] ?? 0) + count;
  }

  return merged;
}

function mergeEntityOperationCounts(
  existingEntityOps: Record<string, Record<string, number>> | undefined,
  incomingEntityOps:
    | Record<
        string,
        {
          reads?: number;
          creates?: number;
          updates?: number;
          deletes?: number;
        }
      >
    | undefined
) {
  const merged: Record<string, Record<string, number>> = {
    ...(existingEntityOps ?? {})
  };

  if (!incomingEntityOps) {
    return merged;
  }

  for (const [rawEntity, ops] of Object.entries(incomingEntityOps)) {
    const entity = rawEntity.replace(/[./#$\[\]]/g, '_').toLowerCase();
    merged[entity] = merged[entity] ?? {};
    if (ops.reads)
      merged[entity]!['reads'] = (merged[entity]!['reads'] ?? 0) + ops.reads;
    if (ops.creates)
      merged[entity]!['creates'] =
        (merged[entity]!['creates'] ?? 0) + ops.creates;
    if (ops.updates)
      merged[entity]!['updates'] =
        (merged[entity]!['updates'] ?? 0) + ops.updates;
    if (ops.deletes)
      merged[entity]!['deletes'] =
        (merged[entity]!['deletes'] ?? 0) + ops.deletes;
  }

  return merged;
}

function toMetrics(data?: Partial<FirebaseUsageMetrics>): FirebaseUsageMetrics {
  return {
    firestoreReads: data?.firestoreReads ?? 0,
    firestoreCreates: data?.firestoreCreates ?? 0,
    firestoreUpdates: data?.firestoreUpdates ?? 0,
    firestoreDeletes: data?.firestoreDeletes ?? 0,
    firestoreBandwidthBytes: data?.firestoreBandwidthBytes ?? 0,
    functionsCalls: data?.functionsCalls ?? 0,
    functionsBandwidthBytes: data?.functionsBandwidthBytes ?? 0,
    functionsExecutionMs: data?.functionsExecutionMs ?? 0,
    storageUploads: data?.storageUploads ?? 0,
    storageDownloads: data?.storageDownloads ?? 0,
    storageDeletes: data?.storageDeletes ?? 0,
    storageUploadBytes: data?.storageUploadBytes ?? 0,
    storageDownloadBytes: data?.storageDownloadBytes ?? 0
  };
}

export const reportusage = onCall(
  {
    ...deployOptions,
    timeoutSeconds: 60
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const parsed = reportUsageSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const { appId, metrics, source, functionCallsByName, entityBreakdown } =
      parsed.data;
    const uid = request.auth.uid;
    const dayKey = getDayKey();
    const monthKey = getMonthKey();
    const usageRef = buildUsageRef(appId, monthKey, uid);
    const dailyUsageRef = buildPeriodUserRef(
      appId,
      DAILY_PERIOD_TYPE,
      dayKey,
      uid
    );
    const monthCollection = buildMonthCollection(appId, monthKey);

    const snapshot = await monthCollection.get();
    const activeUsers = Math.max(1, snapshot.size || 1);

    const existingSnap = await usageRef.get();
    const existing = existingSnap.data() as any;
    const existingMetrics = toMetrics(existing);
    const existingDailySnap = await dailyUsageRef.get();
    const existingDaily = existingDailySnap.data() as any;
    const existingDailyMetrics = toMetrics(existingDaily);
    const nextMetrics = {
      firestoreReads: existingMetrics.firestoreReads + metrics.firestoreReads,
      firestoreCreates:
        existingMetrics.firestoreCreates + metrics.firestoreCreates,
      firestoreUpdates:
        existingMetrics.firestoreUpdates + metrics.firestoreUpdates,
      firestoreDeletes:
        existingMetrics.firestoreDeletes + metrics.firestoreDeletes,
      firestoreBandwidthBytes:
        existingMetrics.firestoreBandwidthBytes +
        metrics.firestoreBandwidthBytes,
      functionsCalls: existingMetrics.functionsCalls + metrics.functionsCalls,
      functionsBandwidthBytes:
        existingMetrics.functionsBandwidthBytes +
        metrics.functionsBandwidthBytes,
      functionsExecutionMs:
        existingMetrics.functionsExecutionMs + metrics.functionsExecutionMs,
      storageUploads: existingMetrics.storageUploads + metrics.storageUploads,
      storageDownloads:
        existingMetrics.storageDownloads + metrics.storageDownloads,
      storageDeletes: existingMetrics.storageDeletes + metrics.storageDeletes,
      storageUploadBytes:
        existingMetrics.storageUploadBytes + metrics.storageUploadBytes,
      storageDownloadBytes:
        existingMetrics.storageDownloadBytes + metrics.storageDownloadBytes
    };
    const nextDailyMetrics = {
      firestoreReads:
        existingDailyMetrics.firestoreReads + metrics.firestoreReads,
      firestoreCreates:
        existingDailyMetrics.firestoreCreates + metrics.firestoreCreates,
      firestoreUpdates:
        existingDailyMetrics.firestoreUpdates + metrics.firestoreUpdates,
      firestoreDeletes:
        existingDailyMetrics.firestoreDeletes + metrics.firestoreDeletes,
      firestoreBandwidthBytes:
        existingDailyMetrics.firestoreBandwidthBytes +
        metrics.firestoreBandwidthBytes,
      functionsCalls:
        existingDailyMetrics.functionsCalls + metrics.functionsCalls,
      functionsBandwidthBytes:
        existingDailyMetrics.functionsBandwidthBytes +
        metrics.functionsBandwidthBytes,
      functionsExecutionMs:
        existingDailyMetrics.functionsExecutionMs +
        metrics.functionsExecutionMs,
      storageUploads:
        existingDailyMetrics.storageUploads + metrics.storageUploads,
      storageDownloads:
        existingDailyMetrics.storageDownloads + metrics.storageDownloads,
      storageDeletes:
        existingDailyMetrics.storageDeletes + metrics.storageDeletes,
      storageUploadBytes:
        existingDailyMetrics.storageUploadBytes + metrics.storageUploadBytes,
      storageDownloadBytes:
        existingDailyMetrics.storageDownloadBytes + metrics.storageDownloadBytes
    };

    const cost = estimateFirebaseCostForUsage(
      nextMetrics,
      DEFAULT_FIREBASE_BLAZE_PRICING,
      activeUsers
    );
    const pricing = suggestPricingFromCost(
      cost.totalUsd,
      DEFAULT_FIREBASE_BLAZE_PRICING
    );

    const perFunction = mergeFunctionCallCounts(
      existing?.functionCallsByName as Record<string, number> | undefined,
      functionCallsByName
    );
    const dailyFunctionCalls = mergeFunctionCallCounts(
      existingDaily?.functionCallsByName as Record<string, number> | undefined,
      functionCallsByName
    );
    const mergedEntityOps = mergeEntityOperationCounts(
      existing?.entityOps as Record<string, Record<string, number>> | undefined,
      entityBreakdown
    );
    const dailyEntityOps = mergeEntityOperationCounts(
      existingDaily?.entityOps as
        | Record<string, Record<string, number>>
        | undefined,
      entityBreakdown
    );

    const owner = {
      uid,
      name:
        (request.auth.token?.name as string | undefined) ||
        (request.auth.token?.email as string | undefined) ||
        uid,
      photoUrl: request.auth.token?.picture as string | undefined
    };

    await usageRef.set(
      {
        id: `${uid}_${monthKey}`,
        appId,
        monthKey,
        periodType: MONTHLY_PERIOD_TYPE,
        periodKey: monthKey,
        owner,
        space: { id: appId },
        source: source ?? 'unknown',
        metrics: nextMetrics,
        firestoreReads: nextMetrics.firestoreReads,
        firestoreCreates: nextMetrics.firestoreCreates,
        firestoreUpdates: nextMetrics.firestoreUpdates,
        firestoreDeletes: nextMetrics.firestoreDeletes,
        firestoreBandwidthBytes: nextMetrics.firestoreBandwidthBytes,
        functionsCalls: nextMetrics.functionsCalls,
        functionsBandwidthBytes: nextMetrics.functionsBandwidthBytes,
        functionsExecutionMs: nextMetrics.functionsExecutionMs,
        storageUploads: nextMetrics.storageUploads,
        storageDownloads: nextMetrics.storageDownloads,
        storageDeletes: nextMetrics.storageDeletes,
        storageUploadBytes: nextMetrics.storageUploadBytes,
        storageDownloadBytes: nextMetrics.storageDownloadBytes,
        functionCallsByName: perFunction,
        entityOps: mergedEntityOps,
        cost,
        pricing,
        createdAt: existing?.createdAt ?? firestoreWriteTimestamp,
        updatedAt: firestoreWriteTimestamp
      },
      { merge: true }
    );

    await dailyUsageRef.set(
      {
        id: `${uid}_${dayKey}`,
        appId,
        dayKey,
        periodType: DAILY_PERIOD_TYPE,
        periodKey: dayKey,
        owner,
        space: { id: appId },
        source: source ?? 'unknown',
        metrics: nextDailyMetrics,
        firestoreReads: nextDailyMetrics.firestoreReads,
        firestoreCreates: nextDailyMetrics.firestoreCreates,
        firestoreUpdates: nextDailyMetrics.firestoreUpdates,
        firestoreDeletes: nextDailyMetrics.firestoreDeletes,
        firestoreBandwidthBytes: nextDailyMetrics.firestoreBandwidthBytes,
        functionsCalls: nextDailyMetrics.functionsCalls,
        functionsBandwidthBytes: nextDailyMetrics.functionsBandwidthBytes,
        functionsExecutionMs: nextDailyMetrics.functionsExecutionMs,
        storageUploads: nextDailyMetrics.storageUploads,
        storageDownloads: nextDailyMetrics.storageDownloads,
        storageDeletes: nextDailyMetrics.storageDeletes,
        storageUploadBytes: nextDailyMetrics.storageUploadBytes,
        storageDownloadBytes: nextDailyMetrics.storageDownloadBytes,
        functionCallsByName: dailyFunctionCalls,
        entityOps: dailyEntityOps,
        createdAt: existingDaily?.createdAt ?? firestoreWriteTimestamp,
        updatedAt: firestoreWriteTimestamp
      },
      { merge: true }
    );

    await buildSummaryRef(appId, monthKey).set(
      {
        appId,
        monthKey,
        periodType: MONTHLY_PERIOD_TYPE,
        periodKey: monthKey,
        updatedAt: firestoreWriteTimestamp,
        lastSource: source ?? 'unknown',
        totals: {
          firestoreReads: firestoreIncrement(metrics.firestoreReads),
          firestoreCreates: firestoreIncrement(metrics.firestoreCreates),
          firestoreUpdates: firestoreIncrement(metrics.firestoreUpdates),
          firestoreDeletes: firestoreIncrement(metrics.firestoreDeletes),
          firestoreBandwidthBytes: firestoreIncrement(
            metrics.firestoreBandwidthBytes
          ),
          functionsCalls: firestoreIncrement(metrics.functionsCalls),
          functionsBandwidthBytes: firestoreIncrement(
            metrics.functionsBandwidthBytes
          ),
          functionsExecutionMs: firestoreIncrement(
            metrics.functionsExecutionMs
          ),
          storageUploads: firestoreIncrement(metrics.storageUploads),
          storageDownloads: firestoreIncrement(metrics.storageDownloads),
          storageDeletes: firestoreIncrement(metrics.storageDeletes),
          storageUploadBytes: firestoreIncrement(metrics.storageUploadBytes),
          storageDownloadBytes: firestoreIncrement(metrics.storageDownloadBytes)
        }
      },
      { merge: true }
    );

    await buildPeriodSummaryRef(appId, DAILY_PERIOD_TYPE, dayKey).set(
      {
        appId,
        dayKey,
        periodType: DAILY_PERIOD_TYPE,
        periodKey: dayKey,
        updatedAt: firestoreWriteTimestamp,
        lastSource: source ?? 'unknown',
        totals: {
          firestoreReads: firestoreIncrement(metrics.firestoreReads),
          firestoreCreates: firestoreIncrement(metrics.firestoreCreates),
          firestoreUpdates: firestoreIncrement(metrics.firestoreUpdates),
          firestoreDeletes: firestoreIncrement(metrics.firestoreDeletes),
          firestoreBandwidthBytes: firestoreIncrement(
            metrics.firestoreBandwidthBytes
          ),
          functionsCalls: firestoreIncrement(metrics.functionsCalls),
          functionsBandwidthBytes: firestoreIncrement(
            metrics.functionsBandwidthBytes
          ),
          functionsExecutionMs: firestoreIncrement(
            metrics.functionsExecutionMs
          ),
          storageUploads: firestoreIncrement(metrics.storageUploads),
          storageDownloads: firestoreIncrement(metrics.storageDownloads),
          storageDeletes: firestoreIncrement(metrics.storageDeletes),
          storageUploadBytes: firestoreIncrement(metrics.storageUploadBytes),
          storageDownloadBytes: firestoreIncrement(metrics.storageDownloadBytes)
        }
      },
      { merge: true }
    );

    return {
      successful: true,
      appId,
      monthKey,
      metrics: nextMetrics,
      cost,
      pricing
    };
  }
);

export const getdashboard = onCall(
  {
    ...deployOptions,
    timeoutSeconds: 120
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const parsed = getDashboardSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const { appId, monthKey = getMonthKey(), lookbackMonths } = parsed.data;
    const monthCollection = buildMonthCollection(appId, monthKey);
    const snap = await monthCollection.get();
    const activeUsers = Math.max(1, snap.size || 1);

    const totals: FirebaseUsageMetrics = {
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

    // Aggregated per-function call counts and per-entity ops across all users
    const functionCallsByName: Record<string, number> = {};
    const entityOps: Record<string, Record<string, number>> = {};

    function mergeEntityOps(
      target: Record<string, Record<string, number>>,
      source: Record<string, Record<string, number>>
    ) {
      for (const [entity, ops] of Object.entries(source)) {
        target[entity] = target[entity] ?? {};
        for (const [op, count] of Object.entries(ops)) {
          target[entity]![op] = (target[entity]![op] ?? 0) + (count as number);
        }
      }
    }

    const perUser = snap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      const metrics = toMetrics(data.metrics ?? data);
      totals.firestoreReads += metrics.firestoreReads;
      totals.firestoreCreates += metrics.firestoreCreates;
      totals.firestoreUpdates += metrics.firestoreUpdates;
      totals.firestoreDeletes += metrics.firestoreDeletes;
      totals.firestoreBandwidthBytes += metrics.firestoreBandwidthBytes;
      totals.functionsCalls += metrics.functionsCalls;
      totals.functionsBandwidthBytes += metrics.functionsBandwidthBytes;
      totals.functionsExecutionMs += metrics.functionsExecutionMs;
      totals.storageUploads += metrics.storageUploads;
      totals.storageDownloads += metrics.storageDownloads;
      totals.storageDeletes += metrics.storageDeletes;
      totals.storageUploadBytes += metrics.storageUploadBytes;
      totals.storageDownloadBytes += metrics.storageDownloadBytes;

      // Aggregate function call counts
      const userFnCalls = (data.functionCallsByName ?? {}) as Record<
        string,
        number
      >;
      for (const [fn, count] of Object.entries(userFnCalls)) {
        functionCallsByName[fn] =
          (functionCallsByName[fn] ?? 0) + (count as number);
      }

      // Aggregate entity ops
      const userEntityOps = (data.entityOps ?? {}) as Record<
        string,
        Record<string, number>
      >;
      mergeEntityOps(entityOps, userEntityOps);

      return {
        uid: data?.owner?.uid ?? docSnap.id,
        name: data?.owner?.name ?? docSnap.id,
        metrics,
        entityOps: userEntityOps,
        cost: estimateFirebaseCostForUsage(
          metrics,
          DEFAULT_FIREBASE_BLAZE_PRICING,
          activeUsers
        )
      };
    });

    const totalCost = estimateFirebaseCostForUsage(
      totals,
      DEFAULT_FIREBASE_BLAZE_PRICING,
      1
    );
    const avgCostPerUser = totalCost.totalUsd / activeUsers;
    const suggestion = suggestPricingFromCost(
      avgCostPerUser,
      DEFAULT_FIREBASE_BLAZE_PRICING
    );

    const now = new Date(`${monthKey}-01T00:00:00.000Z`);
    const trendMonths: string[] = [];
    for (let i = lookbackMonths - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
      );
      trendMonths.push(getMonthKey(d));
    }

    const trend = await Promise.all(
      trendMonths.map(async (mk) => {
        const summaryDoc = await buildSummaryRef(appId, mk).get();
        const summary = summaryDoc.data() as any;
        const monthTotals = toMetrics(summary?.totals);
        const usersCount = Math.max(
          1,
          (await buildMonthCollection(appId, mk).count().get()).data().count ||
            1
        );
        const monthCost = estimateFirebaseCostForUsage(
          monthTotals,
          DEFAULT_FIREBASE_BLAZE_PRICING,
          1
        );
        return {
          monthKey: mk,
          activeUsers: usersCount,
          totalCostUsd: monthCost.totalUsd,
          avgCostPerUserUsd: monthCost.totalUsd / usersCount,
          totals: monthTotals
        };
      })
    );

    const isCurrentMonth = monthKey === getMonthKey();
    const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
    const dailyTrendEnd = isCurrentMonth
      ? new Date()
      : new Date(
          Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
        );
    const dailyKeys: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(
        Date.UTC(
          dailyTrendEnd.getUTCFullYear(),
          dailyTrendEnd.getUTCMonth(),
          dailyTrendEnd.getUTCDate() - i
        )
      );
      dailyKeys.push(getDayKey(d));
    }

    const dailyTrend = await Promise.all(
      dailyKeys.map(async (dayKey) => {
        const summaryDoc = await buildPeriodSummaryRef(
          appId,
          DAILY_PERIOD_TYPE,
          dayKey
        ).get();
        const summary = summaryDoc.data() as any;
        const dayTotals = toMetrics(summary?.totals);
        const dayActiveUsers = Math.max(
          1,
          (
            await buildPeriodUsersCollection(appId, DAILY_PERIOD_TYPE, dayKey)
              .count()
              .get()
          ).data().count || 1
        );

        return {
          dayKey,
          activeUsers: dayActiveUsers,
          totals: dayTotals
        };
      })
    );

    return {
      successful: true,
      appId,
      monthKey,
      activeUsers,
      totals,
      totalCost,
      averageCostPerUserUsd: avgCostPerUser,
      suggestedPricing: suggestion,
      functionCallsByName,
      entityOps,
      perUser: perUser
        .sort((a, b) => b.cost.totalUsd - a.cost.totalUsd)
        .slice(0, 200),
      trend,
      dailyTrend
    };
  }
);
