import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VersionService {
  swUpdate = inject(SwUpdate, { optional: true });
  updateAvailable = signal(false);
  currentVersion = signal('1.0.0');
  newVersion = signal('');

  constructor() {
    if (this.swUpdate?.isEnabled) {
      // Check for updates every 30 seconds
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);

      // Listen for version updates
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
          )
        )
        .subscribe((event) => {
          this.updateAvailable.set(true);
          this.newVersion.set(event.latestVersion.hash);
          console.log('New version available:', event.latestVersion.hash);
        });

      // Check for updates on startup
      this.checkForUpdates();
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.swUpdate?.isEnabled) {
      try {
        const updateAvailable = await this.swUpdate.checkForUpdate();
        if (updateAvailable) {
          console.log('Update check: New version available');
        } else {
          console.log('Update check: Already on latest version');
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }
  }

  async applyUpdate(): Promise<void> {
    if (this.swUpdate?.isEnabled && this.updateAvailable()) {
      try {
        await this.swUpdate.activateUpdate();
        // Reload the page to use the new version
        window.location.reload();
      } catch (error) {
        console.error('Error applying update:', error);
      }
    }
  }

  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }
}
