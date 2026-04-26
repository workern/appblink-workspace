import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService, GlobalManagerService } from '@workern/services';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmIcon } from '@spartan/components/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload, lucideX, lucideSparkles } from '@ng-icons/lucide';

/**
 * Professional Update Notification Component
 *
 * Displays a beautifully designed notification when a new app version is available.
 * Features:
 * - Theme-aware design using app's CSS variable --primary from styles.scss
 * - Glassmorphism and modern shadows
 * - Smooth animations and micro-interactions
 * - Spartan UI components for consistency
 * - Fully accessible with ARIA labels
 *
 * Usage:
 * ```html
 * <app-update-notification appName="Nikat"></app-update-notification>
 * ```
 */
@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmIcon, NgIcon],
  providers: [provideIcons({ lucideDownload, lucideX, lucideSparkles })],
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateNotificationComponent {
  /** The display name of the app */
  appName = input<string>('the app');

  versionService = inject(VersionService);
  private gms = inject(GlobalManagerService);

  async updateNow(): Promise<void> {
    await this.versionService.applyUpdate();
  }

  dismissUpdate(): void {
    this.versionService.dismissUpdate();
  }
}
