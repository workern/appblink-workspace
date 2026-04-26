import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService } from '@workern/services';

@Component({
  selector: 'app-update-notification',
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class UpdateNotificationComponent {
  readonly versionService = inject(VersionService);

  async updateNow(): Promise<void> {
    await this.versionService.applyUpdate();
  }

  dismissUpdate(): void {
    this.versionService.dismissUpdate();
  }
}
