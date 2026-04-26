import { Injectable, signal } from '@angular/core';

export interface SnackbarMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private messages = signal<SnackbarMessage[]>([]);

  getMessages = this.messages.asReadonly();

  show(
    message: string,
    type: SnackbarMessage['type'] = 'info',
    duration = 5000
  ) {
    const id = Math.random().toString(36).substr(2, 9);
    const snackbarMessage: SnackbarMessage = {
      id,
      message,
      type,
      duration
    };

    this.messages.update((messages) => [...messages, snackbarMessage]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  dismiss(id: string) {
    this.messages.update((messages) => messages.filter((msg) => msg.id !== id));
  }

  clear() {
    this.messages.set([]);
  }
}
