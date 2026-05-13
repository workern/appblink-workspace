---
applyTo: 'angular/**/*.{ts,html,css}'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## 🔄 Cross-Platform Synchronization (CRITICAL)

When making changes to Angular apps, **ALWAYS check for corresponding Flutter app** and propose similar changes:

### App Mapping

- `angular/apps/nikat` → `flutter/apps/nikat` (Customer app)
- `angular/apps/nikat-shop-manager` → `flutter/apps/sangrah` (Shop management)
- `angular/apps/workern-admin` → `flutter/apps/sangrah-admin` (Admin dashboard)

### Automatic Actions

1. **After ANY change**, immediately state: "I'm also updating the corresponding Flutter app"
2. **Implement the change** in both platforms unless user says "Angular only"
3. **Verify** that models are synced between `libs/shared/models` and `flutter/packages/workern_models`

### Changes Requiring Sync

- New components/screens
- Form validations
- API calls
- UI elements
- Navigation changes
- Error messages
- Feature additions/removals

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## SEO Requirements (MANDATORY for every new Angular app)

When creating a new Angular app or updating the landing page, the following SEO setup is **required**. Use the `starter-app` as the template — it has all files pre-configured with `TODO:` placeholders to fill in.

### Files to configure for each new app

| File                       | What to update                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/index.html`           | `<title>`, `<meta description>`, OG tags, Twitter Card, JSON-LD, `<link rel="canonical">`           |
| `src/manifest.webmanifest` | `short_name`, `name`, `description`, `categories`, icon paths                                       |
| `src/robots.txt`           | Domain URL in `Sitemap:` directive, add auth-gated routes to `Disallow:`                            |
| `src/sitemap.xml`          | Replace domain, add all public route `<url>` entries, add `<xhtml:link>` hreflang if multi-language |
| `project.json`             | Add `robots.txt` and `sitemap.xml` to the `assets` array                                            |
| Landing component `.ts`    | Inject `SEOService` from `@workern/services`, call `updateSEO()` in `ngOnInit()`                    |

### Checklist when creating a new app from starter

1. **Copy** all files from `angular/apps/starter-app/`
2. **Search for `TODO:`** across all files — every `TODO:` must be replaced with real app content
3. **`index.html`**: Fill `<title>` (60 chars max, include primary keyword), `<meta description>` (150-160 chars), all `og:*` and `twitter:*` tags, canonical URL, JSON-LD schema
4. **`manifest.webmanifest`**: Set real `short_name` (≤12 chars), `name`, `description`, `categories`
5. **`robots.txt`**: Replace `your-app-domain.com`, add all auth-gated routes
6. **`sitemap.xml`**: Replace domain, add all public routes with correct `<priority>` and `<changefreq>`, add `hreflang` if multi-language
7. **Landing component**: Replace all placeholder strings in `seoService.updateSEO(...)` call
8. **OG image**: Create a `1200×630` branded PNG at `src/assets/og-image.png` — this is what shows on link previews in WhatsApp, Slack, Twitter, iMessage

### Core SEO principles

- **Title tag**: Max 60 characters. Format: `App Name — Primary Keyword | by Workern`
- **Meta description**: 150-160 characters. Natural language, includes 1-2 keywords, ends with a CTA or value statement
- **Canonical URL**: Always set to the primary domain (no trailing variants)
- **JSON-LD type**: Use `WebApplication` for SaaS tools; use `Product` for e-commerce; use `Article` for blog posts
- **`robots.txt`**: Always `Disallow` auth-gated routes (`/home`, `/billing`, `/profile`, etc.)
- **Sitemap**: Only include publicly crawlable routes (no auth-gated pages)
- **Per-page SEO**: Call `SEOService.updateSEO()` on `ngOnInit()` of every public-facing page component, not just landing

### SEOService usage

```typescript
import { SEOService } from '@workern/services';

// In any public page component:
private seoService = inject(SEOService);

ngOnInit() {
  this.seoService.updateSEO({
    title: 'Page Title — Keyword | App Name',
    description: '150-160 char description with keywords.',
    keywords: 'keyword1, keyword2, keyword3',
    ogTitle: 'Page Title — Keyword',
    ogDescription: 'Description for social sharing.',
    ogImage: 'https://your-domain.com/assets/og-image.png',
    twitterTitle: 'Page Title — Keyword',
    twitterDescription: 'Description for Twitter.',
    canonical: 'https://your-domain.com/this-page',
    structuredData: { /* schema.org JSON-LD object */ }
  });
}
```
