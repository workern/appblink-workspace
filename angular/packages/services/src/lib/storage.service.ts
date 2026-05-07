import { inject, Injectable } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from '@angular/fire/storage';
import { FirebaseUsageTrackerService } from './firebase-usage-tracker.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly storage = inject(Storage);
  private readonly usageTracker = inject(FirebaseUsageTrackerService);

  async getDownloadUrl(storagePath: string): Promise<string> {
    const storageRef = ref(this.storage, storagePath);
    const url = await getDownloadURL(storageRef);
    this.usageTracker.recordStorageDownload(1);
    return url;
  }

  async uploadFile(
    storagePath: string,
    data: Blob | Uint8Array | ArrayBuffer,
    contentType?: string
  ): Promise<string> {
    const storageRef = ref(this.storage, storagePath);
    await uploadBytes(storageRef, data as Blob | Uint8Array | ArrayBuffer, {
      contentType
    });

    let size = 0;
    if (data instanceof Blob) {
      size = data.size;
    } else if (data instanceof Uint8Array) {
      size = data.byteLength;
    } else {
      size = data.byteLength;
    }

    this.usageTracker.recordStorageUpload(1, size);

    const url = await getDownloadURL(storageRef);
    this.usageTracker.recordStorageDownload(1);
    return url;
  }

  async deleteFile(storagePath: string): Promise<void> {
    const storageRef = ref(this.storage, storagePath);
    await deleteObject(storageRef);
    this.usageTracker.recordStorageDelete(1);
  }
}
