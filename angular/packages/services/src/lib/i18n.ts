/**
 * i18n.ts
 *
 * Central Angular localization setup for the Workern monorepo.
 *
 * Architecture:
 *  - Each source (app + each library) owns its own `en.json` (and generated
 *    translations).
 *  - At runtime the app loads all sources and merges them deeply, so every
 *    component can use `{{ 'components.ui.save' | translate }}` regardless of
 *    which app is hosting the library.
 *  - Translation keys are NAMESPACED to avoid collisions:
 *      `components.*`  — keys from angular/packages/components
 *      `app.*`         — keys owned by the individual app
 *
 * Usage in app.config.ts:
 *
 *   import { provideI18n } from '@workern/services';
 *
 *   export const appConfig = {
 *     providers: [
 *       ...provideI18n(),
 *     ]
 *   };
 *
 * Then import TranslateModule (or TranslatePipe) in any component/standalone:
 *
 *   import { TranslatePipe } from '@ngx-translate/core';
 *   // template: {{ 'app.common.ok' | translate }}
 *
 * Auto-translate on save:
 *   Save `src/assets/i18n/en.json` or
 *        `angular/packages/components/src/lib/i18n/en.json`
 *   → the App Blink extension auto-generates all target language files
 *     via Gemini.
 */

import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import {
  APP_INITIALIZER,
  EnvironmentProviders,
  importProvidersFrom,
  makeEnvironmentProviders
} from '@angular/core';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
  TranslationObject
} from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ─── Supported languages (keep in sync with workern_localization in Flutter) ─

export const WORKERN_SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'pt', name: 'Português', dir: 'ltr' }
] as const;

export type WorkernLocaleCode =
  (typeof WORKERN_SUPPORTED_LOCALES)[number]['code'];
export const DEFAULT_LANG: WorkernLocaleCode = 'en';

// ─── Translation sources ──────────────────────────────────────────────────────

export interface TranslationSource {
  /** Asset path without the leading slash, e.g. "assets/i18n".
   *  Language code and ".json" are appended automatically. */
  assetPath: string;
  /** Optional namespace key; if provided, translations are nested under it.
   *  Leave undefined for flat (root-level) keys. */
  namespace?: string;
}

/**
 * Default translation sources loaded by every Workern app.
 * The app can extend this list by passing extra sources to `provideI18n()`.
 */
export const DEFAULT_TRANSLATION_SOURCES: TranslationSource[] = [
  { assetPath: 'assets/i18n' }, // app-level (no namespace → root)
  { assetPath: 'assets/i18n/components' } // ng-components library (root-level, keys are auth.*, billing.*, etc.)
];

// ─── MultiTranslateLoader ─────────────────────────────────────────────────────

/**
 * Loads translation JSON files from multiple asset paths and deep-merges them.
 * Missing files are silently skipped (returns `{}` on 404).
 */
export class MultiTranslateLoader implements TranslateLoader {
  constructor(
    private http: HttpClient,
    private sources: TranslationSource[]
  ) {}

  getTranslation(lang: string): Observable<TranslationObject> {
    const requests = this.sources.map((source) =>
      this.http
        .get<TranslationObject>(`/${source.assetPath}/${lang}.json`)
        .pipe(catchError(() => of({} as TranslationObject)))
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const merged: TranslationObject = {};
        results.forEach((result, idx) => {
          const ns = this.sources[idx].namespace;
          if (ns) {
            // Nest under namespace key, merging if it already exists
            merged[ns] = deepMerge(
              (merged[ns] as TranslationObject) ?? {},
              result
            );
          } else {
            Object.assign(merged, result);
          }
        });
        return merged;
      })
    );
  }
}

function deepMerge(
  target: TranslationObject,
  source: TranslationObject
): TranslationObject {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(
        result[key] as TranslationObject,
        source[key] as TranslationObject
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ─── provideI18n ─────────────────────────────────────────────────────────────

export interface ProvideI18nOptions {
  /** Additional translation sources beyond the defaults. */
  extraSources?: TranslationSource[];
  /** Default language code. Defaults to 'en'. */
  defaultLang?: WorkernLocaleCode;
}

/**
 * Call inside your `app.config.ts` providers array.
 *
 * @example
 * providers: [
 *   provideI18n(),
 *   // or with extra sources:
 *   provideI18n({ extraSources: [{ assetPath: 'assets/i18n/shop', namespace: 'shop' }] }),
 * ]
 */
export function provideI18n(
  options: ProvideI18nOptions = {}
): EnvironmentProviders {
  const sources = [
    ...DEFAULT_TRANSLATION_SOURCES,
    ...(options.extraSources ?? [])
  ];
  const lang = options.defaultLang ?? DEFAULT_LANG;

  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: lang,
        loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient) =>
            new MultiTranslateLoader(http, sources),
          deps: [HttpClient]
        }
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (ts: TranslateService) => () => {
        const saved =
          typeof localStorage !== 'undefined'
            ? (localStorage.getItem('workern_lang') as WorkernLocaleCode | null)
            : null;
        ts.use(saved ?? lang);
      },
      deps: [TranslateService],
      multi: true
    }
  ]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Switches the app language and persists the choice.
 * Inject `TranslateService` and call this instead of `ts.use()` directly.
 */
export function setAppLanguage(
  translateService: TranslateService,
  code: WorkernLocaleCode
): void {
  translateService.use(code);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('workern_lang', code);
  }
  // Update HTML dir attribute for RTL languages
  const locale = WORKERN_SUPPORTED_LOCALES.find((l) => l.code === code);
  if (typeof document !== 'undefined' && locale) {
    document.documentElement.setAttribute('dir', locale.dir);
    document.documentElement.setAttribute('lang', code);
  }
}
