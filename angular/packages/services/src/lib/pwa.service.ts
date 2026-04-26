import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt = signal(null);
  public installAvailable = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for the beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt available');
        e.preventDefault(); // Prevent the default install prompt
        this.deferredPrompt.set(e);

        // Show notification after a delay to not overwhelm users immediately
        setTimeout(() => {
          this.installAvailable.set(true);
        }, 5000); // Wait 5 seconds before showing install notification
      });

      // Optional: detect install event
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt.set(null);
        this.installAvailable.set(false);
        console.log('PWA installed');
      });
    }
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'no-event'> {
    if (!this.deferredPrompt()) return 'no-event';
    try {
      await this.deferredPrompt().prompt();
      const choice = await this.deferredPrompt().userChoice;
      // reset after prompt (browser can only show it once)
      this.deferredPrompt.set(null);
      this.installAvailable.set(false);
      return choice?.outcome ?? 'no-event';
    } catch (err) {
      console.error('Install prompt error', err);
      return 'dismissed';
    }
  }
}
