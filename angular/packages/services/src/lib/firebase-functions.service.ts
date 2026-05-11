import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Auth } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SnackbarService } from './snackbar.service';
import { FirebaseUsageTrackerService } from './firebase-usage-tracker.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseFunctionsService {
  fns = inject(Functions);
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private snackbarService = inject(SnackbarService);
  private usageTracker = inject(FirebaseUsageTrackerService);

  private getProjectId(overrideProjectId?: string): string {
    const projectId =
      overrideProjectId ??
      this.fns.app.options.projectId ??
      this.auth.app.options.projectId;
    if (!projectId) {
      throw new Error('Firebase projectId is not configured');
    }
    return projectId;
  }

  private buildFunctionUrl(
    functionName: string,
    region = 'asia-south2',
    projectId?: string
  ): string {
    const resolvedProjectId = this.getProjectId(projectId);
    return `https://${region}-${resolvedProjectId}.cloudfunctions.net/${functionName}`;
  }

  async firebaseCall<K = any, T = any>(
    functionName: string,
    data: any = {},
    showSnack = false
  ): Promise<T> {
    const startedAt = Date.now();
    try {
      const result = await httpsCallable<K, T>(this.fns, functionName)(data);
      if (!functionName.startsWith('applicationusage-')) {
        const executionMs = Date.now() - startedAt;
        const bytes =
          this.usageTracker.estimateBytes(data) +
          this.usageTracker.estimateBytes(result.data);
        this.usageTracker.recordFunctionCall(1, bytes, functionName);
        this.usageTracker.recordFunctionExecution(executionMs);
      }
      return result.data;
    } catch (error: any) {
      if (showSnack) {
        this.snackbarService.error(error.message);
      }
      throw error;
    }
  }

  async firebaseRequest<T = unknown>(
    functionName: string,
    method: 'GET' | 'POST',
    data: unknown,
    options?: {
      region?: string;
      projectId?: string;
      includeAuthToken?: boolean;
      showSnack?: boolean;
    }
  ): Promise<T> {
    const startedAt = Date.now();
    try {
      const url = this.buildFunctionUrl(
        functionName,
        options?.region,
        options?.projectId
      );
      const includeAuthToken = options?.includeAuthToken ?? true;
      const headersObject: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (includeAuthToken) {
        // auth.currentUser may be null briefly after onAuthStateChanged fires.
        // Wait up to 3s for it to be populated before failing.
        let firebaseUser = this.auth.currentUser;
        if (!firebaseUser) {
          firebaseUser = await new Promise((resolve) => {
            const unsub = this.auth.onAuthStateChanged((u) => {
              unsub();
              resolve(u);
            });
            setTimeout(() => {
              unsub();
              resolve(null);
            }, 3000);
          });
        }
        if (!firebaseUser) {
          throw new Error('Not authenticated');
        }
        headersObject['Authorization'] =
          `Bearer ${await firebaseUser.getIdToken()}`;
      }

      const response = await firstValueFrom(
        this.http.request<T>(method, url, {
          body: method === 'GET' ? undefined : data,
          params:
            method === 'GET' && data && typeof data === 'object'
              ? (data as Record<string, string | number | boolean>)
              : undefined,
          headers: new HttpHeaders(headersObject)
        })
      );

      if (!functionName.startsWith('applicationusage-')) {
        const executionMs = Date.now() - startedAt;
        const bytes =
          this.usageTracker.estimateBytes(data) +
          this.usageTracker.estimateBytes(response);
        this.usageTracker.recordFunctionCall(1, bytes, functionName);
        this.usageTracker.recordFunctionExecution(executionMs);
      }

      return response;
    } catch (error: any) {
      if (options?.showSnack) {
        this.snackbarService.error(error.message);
      }
      throw error;
    }
  }
}
