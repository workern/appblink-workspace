import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

@Component({
  selector: 'wn-store-install-links',
  imports: [],
  templateUrl: './store-install-links.component.html',
  styleUrl: './store-install-links.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreInstallLinksComponent {
  readonly appName = input('our app');
  readonly title = input('Install the app');
  readonly description = input<string | null>(
    'Get the mobile app from your preferred store.'
  );
  readonly playStoreUrl = input<string | null>(null);
  readonly appStoreUrl = input<string | null>(null);

  protected readonly hasAnyStoreLink = computed(
    () => !!this.playStoreUrl() || !!this.appStoreUrl()
  );
}
