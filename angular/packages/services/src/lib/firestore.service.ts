import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc as afDeleteDoc,
  doc,
  docData,
  query,
  setDoc as afSetDoc,
  Query,
  QueryConstraint,
  CollectionReference,
  DocumentReference,
  updateDoc as afUpdateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FirestoreHelpers } from './firestore-helpers';
import { FirebaseUsageTrackerService } from './firebase-usage-tracker.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private firestoreHelpers = inject(FirestoreHelpers);
  private usageTracker = inject(FirebaseUsageTrackerService);

  private entityFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'unknown';
    return segments.length % 2 === 0
      ? (segments[segments.length - 2] ?? 'unknown')
      : (segments[segments.length - 1] ?? 'unknown');
  }

  /**
   * Get a single document and convert timestamps to dates
   */
  getDoc<T = any>(path: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>;
    return docData(docRef).pipe(
      map((data) => {
        if (!data) return undefined;
        return this.firestoreHelpers.convertTimestampsToDates(data) as T;
      }),
      tap((item) => {
        if (!item) return;
        this.usageTracker.recordFirestoreRead(
          1,
          this.usageTracker.estimateBytes(item),
          this.entityFromPath(path)
        );
      })
    );
  }

  /**
   * Get a collection and convert timestamps to dates
   */
  getCollection<T = any>(
    path: string,
    ...queryConstraints: QueryConstraint[]
  ): Observable<T[]> {
    const colRef = collection(this.firestore, path) as CollectionReference<T>;
    const q =
      queryConstraints.length > 0
        ? (query(colRef, ...queryConstraints) as Query<T>)
        : colRef;

    return collectionData(q).pipe(
      map((items) =>
        items.map((item) =>
          this.firestoreHelpers.convertTimestampsToDates(item)
        )
      ),
      tap((items) => {
        const bytes = this.usageTracker.estimateBytes(items);
        this.usageTracker.recordFirestoreRead(
          items.length,
          bytes,
          this.entityFromPath(path)
        );
      })
    );
  }

  async createDoc<T = unknown>(path: string, data: T): Promise<string> {
    const colRef = collection(this.firestore, path) as CollectionReference<T>;
    const created = await addDoc(colRef, data as any);
    this.usageTracker.recordFirestoreCreate(
      1,
      this.usageTracker.estimateBytes(data),
      this.entityFromPath(path)
    );
    return created.id;
  }

  async setDoc<T = unknown>(
    path: string,
    data: T,
    options?: { merge?: boolean }
  ): Promise<void> {
    const docRef = doc(this.firestore, path);
    await afSetDoc(docRef, data as any, options);
    this.usageTracker.recordFirestoreCreate(
      1,
      this.usageTracker.estimateBytes(data),
      this.entityFromPath(path)
    );
  }

  async updateDoc<T extends Record<string, unknown>>(
    path: string,
    data: T
  ): Promise<void> {
    const docRef = doc(this.firestore, path);
    await afUpdateDoc(docRef, data);
    this.usageTracker.recordFirestoreUpdate(
      1,
      this.usageTracker.estimateBytes(data),
      this.entityFromPath(path)
    );
  }

  async deleteDoc(path: string): Promise<void> {
    const docRef = doc(this.firestore, path);
    await afDeleteDoc(docRef);
    this.usageTracker.recordFirestoreDelete(1, this.entityFromPath(path));
  }

  /**
   * Get the Firestore instance for advanced usage
   */
  getFirestore(): Firestore {
    return this.firestore;
  }
}
