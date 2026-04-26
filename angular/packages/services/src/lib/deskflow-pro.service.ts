import { Injectable, inject } from '@angular/core';
import { orderBy, limit } from '@angular/fire/firestore';
import {
  APPID,
  DeskflowClipboardItem,
  DeskflowClipboardScope,
  DeskflowCleanupSuggestion,
  DeskflowDeviceStatus
} from '@workern/models';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { FirebaseFunctionsService } from './firebase-functions.service';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class DeskflowProService {
  private readonly functionsService = inject(FirebaseFunctionsService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);
  private readonly appId = APPID.DESKFLOWPRO;
  private readonly uid$ = toObservable(this.authService.uid);

  syncDeviceStatus(input: {
    deviceId: string;
    deviceName: string;
    platform: string;
    availableStorageBytes: number;
    totalStorageBytes: number;
    networkDownMbps: number;
    networkUpMbps: number;
  }) {
    return this.functionsService.firebaseCall(
      'deskflowpro-deskflowprosyncstatus',
      input
    );
  }

  saveClipboard(input: {
    text: string;
    sourceDeviceId: string;
    sourceDeviceName: string;
    scope?: DeskflowClipboardScope;
    isFavorite?: boolean;
  }) {
    return this.functionsService.firebaseCall(
      'deskflowpro-deskflowprosaveclipboard',
      {
        ...input,
        scope: input.scope ?? DeskflowClipboardScope.LOCAL_DEVICE,
        isFavorite: input.isFavorite ?? false
      }
    );
  }

  toggleClipboardFavorite(clipboardId: string, isFavorite: boolean) {
    return this.functionsService.firebaseCall(
      'deskflowpro-deskflowprotoggleclipboardfavorite',
      {
        clipboardId,
        isFavorite
      }
    );
  }

  getDashboard(limitCount = 25) {
    return this.functionsService.firebaseCall(
      'deskflowpro-deskflowprogetdashboard',
      {
        limit: limitCount
      }
    );
  }

  streamDeviceStatus(): Observable<DeskflowDeviceStatus | null> {
    return this.userId$().pipe(
      switchMap((uid) => {
        if (!uid) {
          return of(null);
        }

        return this.firestoreService.getCollection<DeskflowDeviceStatus>(
          `users/${uid}/mySpaces/${this.appId}/deviceStatus`,
          orderBy('sampledAt', 'desc'),
          limit(1)
        );
      }),
      switchMap((items) => of(Array.isArray(items) ? (items[0] ?? null) : null))
    );
  }

  streamClipboards(limitCount = 30): Observable<DeskflowClipboardItem[]> {
    return this.userId$().pipe(
      switchMap((uid) => {
        if (!uid) {
          return of([]);
        }

        return this.firestoreService.getCollection<DeskflowClipboardItem>(
          `users/${uid}/mySpaces/${this.appId}/clipboards`,
          orderBy('copiedAt', 'desc'),
          limit(limitCount)
        );
      })
    );
  }

  streamCleanupSuggestions(
    limitCount = 5
  ): Observable<DeskflowCleanupSuggestion[]> {
    return this.userId$().pipe(
      switchMap((uid) => {
        if (!uid) {
          return of([]);
        }

        return this.firestoreService.getCollection<DeskflowCleanupSuggestion>(
          `users/${uid}/mySpaces/${this.appId}/cleanupSuggestions`,
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        );
      })
    );
  }

  private userId$() {
    return this.uid$;
  }
}
