import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  GlobalManagerService,
  PwaService,
  VersionService
} from '@workern/services';
import {
  UpdateNotificationComponent,
  InstallNotificationComponent
} from '@workern/components';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    UpdateNotificationComponent,
    InstallNotificationComponent
  ]
})
export class AppComponent implements OnInit {
  private readonly gms = inject(GlobalManagerService);
  private readonly versionService = inject(VersionService);
  private readonly pwaService = inject(PwaService);

  ngOnInit(): void {
    this.gms.config.set({
      appKeyName: 'starterApp',
      appDisplayName: 'Starter App',
      spaceId: 'starterApp',
      initialReturnUrl: '/home'
    });

    this.versionService.checkForUpdates();
  }

  async installApp(): Promise<void> {
    await this.pwaService.promptInstall();
  }
}
