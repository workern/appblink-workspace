import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  inject
} from '@angular/core';
import { GtagService } from '@workern/services';

@Component({
  selector: 'wn-store-install-links',
  imports: [],
  templateUrl: './store-install-links.component.html',
  styleUrl: './store-install-links.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreInstallLinksComponent {
  private readonly gtagService = inject(GtagService);
  readonly appName = input('our app');
  readonly playStoreUrl = input<string | undefined>(undefined);
  readonly appStoreUrl = input<string | undefined>(undefined);
  readonly title = input('Get the app');
  readonly description = input<string | undefined>(undefined);
  protected readonly hasAnyStoreLink = computed(
    () => !!this.playStoreUrl() || !!this.appStoreUrl()
  );

  onStoreClick(platform: 'android' | 'ios') {
    this.gtagService.sendEvent('cta_install_click', { platform });
  }
}
