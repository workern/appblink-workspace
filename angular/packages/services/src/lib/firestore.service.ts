import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  Query,
  QueryConstraint,
  CollectionReference,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreHelpers } from './firestore-helpers';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private firestoreHelpers = inject(FirestoreHelpers);

  /**
   * Get a single document and convert timestamps to dates
   */
  getDoc<T = any>(path: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>;
    return docData(docRef).pipe(
      map((data) => {
        if (!data) return undefined;
        return this.firestoreHelpers.convertTimestampsToDates(data) as T;
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
      )
    );
  }

  /**
   * Get the Firestore instance for advanced usage
   */
  getFirestore(): Firestore {
    return this.firestore;
  }
}
