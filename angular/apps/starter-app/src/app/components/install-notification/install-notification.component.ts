import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '@workern/services';

@Component({
  selector: 'app-install-notification',
  templateUrl: './install-notification.component.html',
  styleUrl: './install-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class InstallNotificationComponent {
  readonly pwaService = inject(PwaService);
  readonly isDismissed = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(
        'starter-install-notification-dismissed'
      );
      if (dismissed === 'true') {
        this.isDismissed.set(true);
      }
    }
  }

  async installNow(): Promise<void> {
    const result = await this.pwaService.promptInstall();
    if (result === 'accepted') {
      this.isDismissed.set(true);
    }
  }

  dismissInstall(): void {
    this.isDismissed.set(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('starter-install-notification-dismissed', 'true');
    }
  }
}
