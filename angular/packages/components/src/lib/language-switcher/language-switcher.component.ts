import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  WORKERN_SUPPORTED_LOCALES,
  WorkernLocaleCode,
  setAppLanguage
} from '@workern/services';

@Component({
  selector: 'workern-language-switcher',
  standalone: true,
  imports: [],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  private readonly ts = inject(TranslateService);

  /** Show locale name or just the language code. Default: 'name' */
  readonly displayMode = input<'name' | 'code'>('name');

  readonly locales = WORKERN_SUPPORTED_LOCALES;
  readonly currentLang = signal<WorkernLocaleCode>(
    (this.ts.currentLang ?? this.ts.defaultLang ?? 'en') as WorkernLocaleCode
  );

  onValueChange(code: string | undefined): void {
    if (!code) return;
    const lang = code as WorkernLocaleCode;
    this.currentLang.set(lang);
    setAppLanguage(this.ts, lang);
  }
}
