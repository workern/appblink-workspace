import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  bumpFirebaseUsageEntityOp,
  cloneFirebaseUsageEntityBreakdown,
  FirebaseUsageEntityBreakdown,
  FirebaseUsageMetrics,
  FirebaseUsageTrackerEngine,
  hasFirebaseUsageEntityBreakdown,
  mergeFirebaseUsageEntityBreakdown
} from '../../../../../libs/shared/utils/src';
import { GlobalManagerService } from './global-manager-service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUsageTrackerService {
  private readonly functions = inject(Functions);
  private readonly globalManagerService = inject(GlobalManagerService);
  private readonly engine = new FirebaseUsageTrackerEngine();
  private functionCallsByName: Record<string, number> = {};
  private entityBreakdown: FirebaseUsageEntityBreakdown = {};
  private readonly flushIntervalMs = 30_000;

  constructor() {
    setInterval(() => {
      void this.flushToBackend('interval');
    }, this.flushIntervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void this.flushToBackend('beforeunload');
      });
    }
  }

  recordFirestoreRead(docCount = 1, bytes = 0, entity?: string): void {
    this.engine.recordFirestoreRead(docCount, bytes);
    bumpFirebaseUsageEntityOp(this.entityBreakdown, entity, 'reads', docCount);
  }

  recordFirestoreCreate(docCount = 1, bytes = 0, entity?: string): void {
    this.engine.recordFirestoreCreate(docCount, bytes);
    bumpFirebaseUsageEntityOp(
      this.entityBreakdown,
      entity,
      'creates',
      docCount
    );
  }

  recordFirestoreUpdate(docCount = 1, bytes = 0, entity?: string): void {
    this.engine.recordFirestoreUpdate(docCount, bytes);
    bumpFirebaseUsageEntityOp(
      this.entityBreakdown,
      entity,
      'updates',
      docCount
    );
  }

  recordFirestoreDelete(docCount = 1, entity?: string): void {
    this.engine.recordFirestoreDelete(docCount);
    bumpFirebaseUsageEntityOp(
      this.entityBreakdown,
      entity,
      'deletes',
      docCount
    );
  }

  recordFunctionCall(callCount = 1, bytes = 0, functionName?: string): void {
    this.engine.recordFunctionCall(callCount, bytes);
    if (functionName) {
      this.functionCallsByName[functionName] =
        (this.functionCallsByName[functionName] ?? 0) + callCount;
    }
  }

  recordFunctionExecution(executionMs = 0): void {
    this.engine.recordFunctionExecution(executionMs);
  }

  recordStorageUpload(operationCount = 1, bytes = 0): void {
    this.engine.recordStorageUpload(operationCount, bytes);
  }

  recordStorageDownload(operationCount = 1, bytes = 0): void {
    this.engine.recordStorageDownload(operationCount, bytes);
  }

  recordStorageDelete(operationCount = 1): void {
    this.engine.recordStorageDelete(operationCount);
  }

  estimateBytes(payload: unknown): number {
    if (payload == null) return 0;
    try {
      const json = JSON.stringify(payload);
      return new TextEncoder().encode(json).byteLength;
    } catch {
      return 0;
    }
  }

  snapshot(): FirebaseUsageMetrics {
    return this.engine.snapshot();
  }

  async flushToBackend(source = 'angular'): Promise<void> {
    const appId = this.globalManagerService.appKeyName();
    if (!appId) {
      return;
    }

    const metrics = this.engine.drain();
    const hasAnyUsage = Object.values(
      metrics as unknown as Record<string, number>
    ).some((value) => value > 0);
    const hasFunctionBreakdown =
      Object.keys(this.functionCallsByName).length > 0;
    const hasEntityBreakdown = hasFirebaseUsageEntityBreakdown(
      this.entityBreakdown
    );
    if (!hasAnyUsage && !hasFunctionBreakdown && !hasEntityBreakdown) {
      return;
    }

    const functionCallsByName = { ...this.functionCallsByName };
    const entityBreakdown = cloneFirebaseUsageEntityBreakdown(
      this.entityBreakdown
    );
    this.functionCallsByName = {};
    this.entityBreakdown = {};

    try {
      await httpsCallable(
        this.functions,
        'applicationusage-reportusage'
      )({
        appId,
        metrics,
        source,
        functionCallsByName,
        entityBreakdown
      });
    } catch {
      this.engine.record({ metrics });
      for (const [functionName, callCount] of Object.entries(
        functionCallsByName
      )) {
        this.functionCallsByName[functionName] =
          (this.functionCallsByName[functionName] ?? 0) + callCount;
      }
      mergeFirebaseUsageEntityBreakdown(this.entityBreakdown, entityBreakdown);
    }
  }
}
