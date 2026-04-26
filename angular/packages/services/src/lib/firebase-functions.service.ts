import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseFunctionsService {
  fns = inject(Functions);
  private snackbarService = inject(SnackbarService);

  async firebaseCall<K = any, T = any>(
    functionName: string,
    data: any = {},
    showSnack = false
  ): Promise<T> {
    try {
      const result = await httpsCallable<K, T>(this.fns, functionName)(data);
      return result.data;
    } catch (error: any) {
      if (showSnack) {
        this.snackbarService.error(error.message);
      }
      throw error;
    }
  }

  firebaseRequest(functionName: string, method: 'GET' | 'POST', data: any) {
    // return this.http.
  }
}
