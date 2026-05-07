import { inject, Injectable } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from '@angular/fire/storage';
import { FirebaseUsageTrackerService } from './firebase-usage-tracker.service';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv'];

export type MediaType = 'photo' | 'video';

export interface MediaUploadResult {
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  duration?: number;
}

interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly storage = inject(Storage);
  private readonly usageTracker = inject(FirebaseUsageTrackerService);

  async uploadMedia(options: {
    file: File;
    storagePath: string;
    imageQuality?: number;
    generateThumbnail?: boolean;
  }): Promise<MediaUploadResult> {
    const imageQuality = options.imageQuality ?? 85;
    const generateThumbnail = options.generateThumbnail ?? true;

    const extension = this.getExtension(options.file.name);
    const isVideo = VIDEO_EXTENSIONS.includes(extension);
    const isImage = IMAGE_EXTENSIONS.includes(extension);

    if (!isVideo && !isImage) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    if (isImage) {
      return this.uploadImage({
        file: options.file,
        storagePath: options.storagePath,
        quality: imageQuality
      });
    }

    return this.uploadVideo({
      file: options.file,
      storagePath: options.storagePath,
      generateThumbnail
    });
  }

  async deleteMedia(storagePath: string): Promise<void> {
    const storageRef = ref(this.storage, storagePath);
    await deleteObject(storageRef);
    this.usageTracker.recordStorageDelete(1);
  }

  private async uploadImage(options: {
    file: File;
    storagePath: string;
    quality: number;
  }): Promise<MediaUploadResult> {
    const compressed = await this.compressImage(options.file, options.quality);
    const timestamp = Date.now();
    const extension = this.getExtension(options.file.name) || '.jpg';
    const fileName = `image_${timestamp}${extension}`;
    const fullPath = this.joinPath(options.storagePath, fileName);

    const storageRef = ref(this.storage, fullPath);
    await uploadBytes(storageRef, compressed.file, {
      contentType: compressed.file.type || 'image/jpeg'
    });
    this.usageTracker.recordStorageUpload(1, compressed.file.size);

    const downloadUrl = await getDownloadURL(storageRef);
    this.usageTracker.recordStorageDownload(1);

    return {
      storagePath: fullPath,
      downloadUrl,
      thumbnailUrl: downloadUrl,
      mediaType: 'photo',
      width: compressed.width,
      height: compressed.height
    };
  }

  private async uploadVideo(options: {
    file: File;
    storagePath: string;
    generateThumbnail: boolean;
  }): Promise<MediaUploadResult> {
    const timestamp = Date.now();
    const fileName = `video_${timestamp}.mp4`;
    const fullPath = this.joinPath(options.storagePath, fileName);

    const storageRef = ref(this.storage, fullPath);
    await uploadBytes(storageRef, options.file, {
      contentType: options.file.type || 'video/mp4'
    });
    this.usageTracker.recordStorageUpload(1, options.file.size);

    const downloadUrl = await getDownloadURL(storageRef);
    this.usageTracker.recordStorageDownload(1);
    const metadata = await this.readVideoMetadata(options.file);

    let thumbnailUrl: string | undefined;
    if (options.generateThumbnail) {
      thumbnailUrl = await this.generateAndUploadThumbnail({
        videoFile: options.file,
        storagePath: options.storagePath,
        timestamp
      });
    }

    return {
      storagePath: fullPath,
      downloadUrl,
      thumbnailUrl,
      mediaType: 'video',
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration
    };
  }

  private async compressImage(
    file: File,
    quality: number
  ): Promise<{ file: File; width?: number; height?: number }> {
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = this.scaleToMax(
        bitmap.width,
        bitmap.height,
        1920
      );

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        return { file, width: bitmap.width, height: bitmap.height };
      }

      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await this.canvasToBlob(
        canvas,
        'image/jpeg',
        Math.min(1, Math.max(0.1, quality / 100))
      );

      if (!blob) {
        return { file, width: bitmap.width, height: bitmap.height };
      }

      const compressedFile = new File(
        [blob],
        this.withExtension(file.name, '.jpg'),
        {
          type: 'image/jpeg',
          lastModified: Date.now()
        }
      );

      return { file: compressedFile, width, height };
    } catch {
      return { file };
    }
  }

  private async generateAndUploadThumbnail(options: {
    videoFile: File;
    storagePath: string;
    timestamp: number;
  }): Promise<string | undefined> {
    try {
      const thumbnailBlob = await this.captureVideoThumbnail(options.videoFile);
      if (!thumbnailBlob) {
        return undefined;
      }

      const thumbnailName = `thumbnail_${options.timestamp}.jpg`;
      const thumbnailPath = this.joinPath(options.storagePath, thumbnailName);

      const storageRef = ref(this.storage, thumbnailPath);
      await uploadBytes(storageRef, thumbnailBlob, {
        contentType: 'image/jpeg'
      });
      this.usageTracker.recordStorageUpload(1, thumbnailBlob.size);

      const thumbnailUrl = await getDownloadURL(storageRef);
      this.usageTracker.recordStorageDownload(1);
      return thumbnailUrl;
    } catch {
      return undefined;
    }
  }

  private async captureVideoThumbnail(videoFile: File): Promise<Blob | null> {
    const objectUrl = URL.createObjectURL(videoFile);

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = objectUrl;

      await this.waitForEvent(video, 'loadedmetadata');

      const seekTime =
        video.duration && Number.isFinite(video.duration)
          ? Math.min(1, Math.max(video.duration * 0.1, 0))
          : 0;

      video.currentTime = seekTime;
      await this.waitForEvent(video, 'seeked');

      const target = this.scaleToMax(
        video.videoWidth || 640,
        video.videoHeight || 640,
        640
      );
      const canvas = document.createElement('canvas');
      canvas.width = target.width;
      canvas.height = target.height;

      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return await this.canvasToBlob(canvas, 'image/jpeg', 0.8);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private async readVideoMetadata(file: File): Promise<VideoMetadata> {
    const objectUrl = URL.createObjectURL(file);

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = objectUrl;

      await this.waitForEvent(video, 'loadedmetadata');

      return {
        width: Number.isFinite(video.videoWidth) ? video.videoWidth : undefined,
        height: Number.isFinite(video.videoHeight)
          ? video.videoHeight
          : undefined,
        duration: Number.isFinite(video.duration)
          ? Math.round(video.duration)
          : undefined
      };
    } catch {
      return {};
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private scaleToMax(
    width: number,
    height: number,
    maxEdge: number
  ): { width: number; height: number } {
    if (width <= maxEdge && height <= maxEdge) {
      return { width, height };
    }

    const ratio = width / height;
    if (width >= height) {
      return {
        width: maxEdge,
        height: Math.round(maxEdge / ratio)
      };
    }

    return {
      width: Math.round(maxEdge * ratio),
      height: maxEdge
    };
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  private waitForEvent(
    element: HTMLVideoElement,
    eventName: 'loadedmetadata' | 'seeked'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const onSuccess = () => {
        element.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        element.removeEventListener(eventName, onSuccess);
        reject(new Error(`Failed during video event: ${eventName}`));
      };

      element.addEventListener(eventName, onSuccess, { once: true });
      element.addEventListener('error', onError, { once: true });
    });
  }

  private getExtension(fileName: string): string {
    const index = fileName.lastIndexOf('.');
    if (index === -1) {
      return '';
    }
    return fileName.slice(index).toLowerCase();
  }

  private withExtension(fileName: string, extension: string): string {
    const index = fileName.lastIndexOf('.');
    if (index === -1) {
      return `${fileName}${extension}`;
    }
    return `${fileName.slice(0, index)}${extension}`;
  }

  private joinPath(basePath: string, fileName: string): string {
    const normalizedBase = basePath.endsWith('/')
      ? basePath.slice(0, -1)
      : basePath;
    return `${normalizedBase}/${fileName}`;
  }
}
