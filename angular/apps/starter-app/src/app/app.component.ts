import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,signal
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
// import {
//   GlobalManagerService,
//   PwaService,
//   VersionService
// } from '@workern/services';
// import {
//   UpdateNotificationComponent,
//   InstallNotificationComponent
// } from '@workern/components';
import { APPID } from '@workern/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    // UpdateNotificationComponent,
    // InstallNotificationComponent
  ]
})
export class AppComponent implements OnInit {
  // private readonly gms = inject(GlobalManagerService);
  // private readonly versionService = inject(VersionService);
  // private readonly pwaService = inject(PwaService);
  readonly appDislayName = signal('Starter App');

  ngOnInit(): void {
    // this.gms.config.set({
    //   appKeyName: APPID.STARTER_APP,
    //   appDisplayName: this.appDislayName(),
    //   spaceId: APPID.STARTER_APP,
    //   initialReturnUrl: '/home'
    // });

    // this.versionService.checkForUpdates();
  }

  async installApp(): Promise<void> {
    // await this.pwaService.promptInstall();
  }
}
