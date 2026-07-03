import { DocumentReference, DocumentSnapshot, Query, QuerySnapshot, WriteResult } from 'firebase-admin/firestore';
import { recordBackendUsage, BackendUsageMetrics, EntityOps } from './applicationusage';
import { db } from '../global';

export class TrackedFirestore {
  private metrics: Required<Omit<BackendUsageMetrics, 'entityBreakdown' | 'aiBreakdown'>> = {
    firestoreReads: 0,
    firestoreCreates: 0,
    firestoreUpdates: 0,
    firestoreDeletes: 0,
    storageUploads: 0,
    storageDownloads: 0,
    storageDeletes: 0,
    storageUploadBytes: 0,
    storageDownloadBytes: 0,
    aiCalls: 0,
    aiInputTokens: 0,
    aiOutputTokens: 0
  };

  private entityBreakdown: Record<string, Required<EntityOps>> = {};

  constructor(
    private appId: string,
    private uid: string,
    private fnName: string
  ) {}

  private incrementEntity(entity: string, type: keyof EntityOps, amount = 1) {
    if (!this.entityBreakdown[entity]) {
      this.entityBreakdown[entity] = { reads: 0, creates: 0, updates: 0, deletes: 0 };
    }
    this.entityBreakdown[entity][type] += amount;
  }

  /**
   * Reads a single document snapshot and increments reads.
   */
  async getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
    this.metrics.firestoreReads++;
    const pathParts = docRef.path.split('/');
    const entity = pathParts[pathParts.length - 2] || 'unknown';
    this.incrementEntity(entity, 'reads');
    return docRef.get();
  }

  /**
   * Executes a count query, increments firestoreReads by 1.
   */
  async getCount(query: Query): Promise<number> {
    this.metrics.firestoreReads++;
    const snap = await query.count().get();
    return snap.data().count;
  }

  /**
   * Executes a query, increments reads by the size of the result (minimum 1 read).
   */
  async getQuery(query: Query): Promise<QuerySnapshot> {
    const snap = await query.get();
    const docCount = snap.size;
    const readsCount = Math.max(1, docCount);
    this.metrics.firestoreReads += readsCount;

    // Resolve query collection name for breakdown
    const queryPath = (query as any)._queryOptions?.collectionId || 'query';
    this.incrementEntity(queryPath, 'reads', readsCount);

    return snap;
  }

  /**
   * Sets a document and tracks creates/updates.
   */
  async setDoc(docRef: DocumentReference, data: any, options?: { merge?: boolean }): Promise<WriteResult> {
    const pathParts = docRef.path.split('/');
    const entity = pathParts[pathParts.length - 2] || 'unknown';

    if (options?.merge) {
      this.metrics.firestoreUpdates++;
      this.incrementEntity(entity, 'updates');
    } else {
      this.metrics.firestoreCreates++;
      this.incrementEntity(entity, 'creates');
    }
    return docRef.set(data, options || {});
  }

  /**
   * Updates a document and tracks updates.
   */
  async updateDoc(docRef: DocumentReference, data: any): Promise<WriteResult> {
    this.metrics.firestoreUpdates++;
    const pathParts = docRef.path.split('/');
    const entity = pathParts[pathParts.length - 2] || 'unknown';
    this.incrementEntity(entity, 'updates');
    return docRef.update(data);
  }

  /**
   * Deletes a document and tracks deletes.
   */
  async deleteDoc(docRef: DocumentReference): Promise<WriteResult> {
    this.metrics.firestoreDeletes++;
    const pathParts = docRef.path.split('/');
    const entity = pathParts[pathParts.length - 2] || 'unknown';
    this.incrementEntity(entity, 'deletes');
    return docRef.delete();
  }

  /**   * Tracks an AI model call with token usage.
   */
  recordAiCall(inputTokens = 0, outputTokens = 0) {
    this.metrics.aiCalls++;
    this.metrics.aiInputTokens += inputTokens;
    this.metrics.aiOutputTokens += outputTokens;
  }

  /**   * Flushes recorded telemetry parameters to the central usage database.
   */
  async flush(): Promise<void> {
    // Exclude flushing if no operations were recorded
    const totalOps = 
      this.metrics.firestoreReads + 
      this.metrics.firestoreCreates + 
      this.metrics.firestoreUpdates + 
      this.metrics.firestoreDeletes;

    if (totalOps === 0) return;

    await recordBackendUsage(this.appId, this.uid, this.fnName, {
      ...this.metrics,
      entityBreakdown: this.entityBreakdown
    });
  }
}
