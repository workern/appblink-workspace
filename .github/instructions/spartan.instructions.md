---
applyTo: 'angular/**'
---

Theming
AI Assist
Customize your design system with CSS variables. No theming API required.

spartan/ui uses CSS variables for theming. Change colors across your entire application by updating values in your styles.css file - no component props, no complex configuration.

<div class="bg-background text-foreground">Themed content</div>
How it works
CSS variables are defined in your styles.css and referenced in Tailwind utility classes. Update the variable, and every component using that color updates automatically.

styles.css

:root {
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
}
Use the color in your markup with Tailwind classes:

<button class="bg-primary text-primary-foreground">Click me</button>
Color naming convention
spartan follows a background and foreground convention for semantic color pairs. Each background color has a corresponding foreground color for text that sits on top of it.

Background colors:

bg-primary
bg-secondary
bg-destructive
bg-muted
Foreground colors:

text-primary-foreground
text-secondary-foreground
text-destructive-foreground
text-muted-foreground
The -background suffix is omitted from CSS variable names. The variable --primary maps to the class bg-primary .

Available variables
Here are all CSS variables you can customize. Define them in :root for light mode and .dark for dark mode:

styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--card: oklch(1 0 0);
--card-foreground: oklch(0.145 0 0);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.97 0 0);
--secondary-foreground: oklch(0.205 0 0);
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.556 0 0);
--accent: oklch(0.97 0 0);
--accent-foreground: oklch(0.205 0 0);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.922 0 0);
--input: oklch(0.922 0 0);
--ring: oklch(0.708 0 0);
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);
--sidebar-ring: oklch(0.708 0 0);
}

.dark {
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--card: oklch(0.205 0 0);
--card-foreground: oklch(0.985 0 0);
--popover: oklch(0.205 0 0);
--popover-foreground: oklch(0.985 0 0);
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
--secondary: oklch(0.269 0 0);
--secondary-foreground: oklch(0.985 0 0);
--muted: oklch(0.269 0 0);
--muted-foreground: oklch(0.708 0 0);
--accent: oklch(0.269 0 0);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.556 0 0);
--sidebar: oklch(0.205 0 0);
--sidebar-foreground: oklch(0.985 0 0);
--sidebar-primary: oklch(0.985 0 0);
--sidebar-primary-foreground: oklch(0.205 0 0);
--sidebar-accent: oklch(0.269 0 0);
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.556 0 0);
}
Use OKLCH without the color space function. Define variables as oklch(0.5 0.2 180) , not oklch(0.5, 0.2, 180) . See the Tailwind documentation for details.

Adding custom colors
Add new semantic colors by defining the CSS variable and registering it with Tailwind:

styles.css

:root {
--warning: oklch(0.84 0.16 84);
--warning-foreground: oklch(0.28 0.07 46);
}

.dark {
--warning: oklch(0.41 0.11 46);
--warning-foreground: oklch(0.99 0.02 95);
}

@theme inline {
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
}
Use the new color with Tailwind classes:

<div class="bg-warning text-warning-foreground">Warning message</div>
Base Colors
Neutral
styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--card: oklch(1 0 0);
--card-foreground: oklch(0.145 0 0);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.97 0 0);
--secondary-foreground: oklch(0.205 0 0);
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.556 0 0);
--accent: oklch(0.97 0 0);
--accent-foreground: oklch(0.205 0 0);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.922 0 0);
--input: oklch(0.922 0 0);
--ring: oklch(0.708 0 0);
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);
--sidebar-ring: oklch(0.708 0 0);
}

.dark {
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--card: oklch(0.205 0 0);
--card-foreground: oklch(0.985 0 0);
--popover: oklch(0.205 0 0);
--popover-foreground: oklch(0.985 0 0);
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
--secondary: oklch(0.269 0 0);
--secondary-foreground: oklch(0.985 0 0);
--muted: oklch(0.269 0 0);
--muted-foreground: oklch(0.708 0 0);
--accent: oklch(0.269 0 0);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.556 0 0);
--sidebar: oklch(0.205 0 0);
--sidebar-foreground: oklch(0.985 0 0);
--sidebar-primary: oklch(0.985 0 0);
--sidebar-primary-foreground: oklch(0.205 0 0);
--sidebar-accent: oklch(0.269 0 0);
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.556 0 0);
}
Stone
styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.147 0.004 49.25);
--card: oklch(1 0 0);
--card-foreground: oklch(0.147 0.004 49.25);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.147 0.004 49.25);
--primary: oklch(0.216 0.006 56.043);
--primary-foreground: oklch(0.985 0.001 106.423);
--secondary: oklch(0.97 0.001 106.424);
--secondary-foreground: oklch(0.216 0.006 56.043);
--muted: oklch(0.97 0.001 106.424);
--muted-foreground: oklch(0.553 0.013 58.071);
--accent: oklch(0.97 0.001 106.424);
--accent-foreground: oklch(0.216 0.006 56.043);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.923 0.003 48.717);
--input: oklch(0.923 0.003 48.717);
--ring: oklch(0.709 0.01 56.259);
--sidebar: oklch(0.985 0.001 106.423);
--sidebar-foreground: oklch(0.147 0.004 49.25);
--sidebar-primary: oklch(0.216 0.006 56.043);
--sidebar-primary-foreground: oklch(0.985 0.001 106.423);
--sidebar-accent: oklch(0.97 0.001 106.424);
--sidebar-accent-foreground: oklch(0.216 0.006 56.043);
--sidebar-border: oklch(0.923 0.003 48.717);
--sidebar-ring: oklch(0.709 0.01 56.259);
}

.dark {
--background: oklch(0.147 0.004 49.25);
--foreground: oklch(0.985 0.001 106.423);
--card: oklch(0.216 0.006 56.043);
--card-foreground: oklch(0.985 0.001 106.423);
--popover: oklch(0.216 0.006 56.043);
--popover-foreground: oklch(0.985 0.001 106.423);
--primary: oklch(0.923 0.003 48.717);
--primary-foreground: oklch(0.216 0.006 56.043);
--secondary: oklch(0.268 0.007 34.298);
--secondary-foreground: oklch(0.985 0.001 106.423);
--muted: oklch(0.268 0.007 34.298);
--muted-foreground: oklch(0.709 0.01 56.259);
--accent: oklch(0.268 0.007 34.298);
--accent-foreground: oklch(0.985 0.001 106.423);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.553 0.013 58.071);
--sidebar: oklch(0.216 0.006 56.043);
--sidebar-foreground: oklch(0.985 0.001 106.423);
--sidebar-primary: oklch(0.985 0.001 106.423);
--sidebar-primary-foreground: oklch(0.216 0.006 56.043);
--sidebar-accent: oklch(0.268 0.007 34.298);
--sidebar-accent-foreground: oklch(0.985 0.001 106.423);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.553 0.013 58.071);
}
Zinc
styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.141 0.005 285.823);
--card: oklch(1 0 0);
--card-foreground: oklch(0.141 0.005 285.823);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.141 0.005 285.823);
--primary: oklch(0.21 0.006 285.885);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.967 0.001 286.375);
--secondary-foreground: oklch(0.21 0.006 285.885);
--muted: oklch(0.967 0.001 286.375);
--muted-foreground: oklch(0.552 0.016 285.938);
--accent: oklch(0.967 0.001 286.375);
--accent-foreground: oklch(0.21 0.006 285.885);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.92 0.004 286.32);
--input: oklch(0.92 0.004 286.32);
--ring: oklch(0.705 0.015 286.067);
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.141 0.005 285.823);
--sidebar-primary: oklch(0.21 0.006 285.885);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.967 0.001 286.375);
--sidebar-accent-foreground: oklch(0.21 0.006 285.885);
--sidebar-border: oklch(0.92 0.004 286.32);
--sidebar-ring: oklch(0.705 0.015 286.067);
}

.dark {
--background: oklch(0.141 0.005 285.823);
--foreground: oklch(0.985 0 0);
--card: oklch(0.21 0.006 285.885);
--card-foreground: oklch(0.985 0 0);
--popover: oklch(0.21 0.006 285.885);
--popover-foreground: oklch(0.985 0 0);
--primary: oklch(0.92 0.004 286.32);
--primary-foreground: oklch(0.21 0.006 285.885);
--secondary: oklch(0.274 0.006 286.033);
--secondary-foreground: oklch(0.985 0 0);
--muted: oklch(0.274 0.006 286.033);
--muted-foreground: oklch(0.705 0.015 286.067);
--accent: oklch(0.274 0.006 286.033);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.552 0.016 285.938);
--sidebar: oklch(0.21 0.006 285.885);
--sidebar-foreground: oklch(0.985 0 0);
--sidebar-primary: oklch(0.985 0 0);
--sidebar-primary-foreground: oklch(0.21 0.006 285.885);
--sidebar-accent: oklch(0.274 0.006 286.033);
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.552 0.016 285.938);
}
Gray
styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.13 0.028 261.692);
--card: oklch(1 0 0);
--card-foreground: oklch(0.13 0.028 261.692);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.13 0.028 261.692);
--primary: oklch(0.21 0.034 264.665);
--primary-foreground: oklch(0.985 0.002 247.839);
--secondary: oklch(0.967 0.003 264.542);
--secondary-foreground: oklch(0.21 0.034 264.665);
--muted: oklch(0.967 0.003 264.542);
--muted-foreground: oklch(0.551 0.027 264.364);
--accent: oklch(0.967 0.003 264.542);
--accent-foreground: oklch(0.21 0.034 264.665);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.928 0.006 264.531);
--input: oklch(0.928 0.006 264.531);
--ring: oklch(0.707 0.022 261.325);
--sidebar: oklch(0.985 0.002 247.839);
--sidebar-foreground: oklch(0.13 0.028 261.692);
--sidebar-primary: oklch(0.21 0.034 264.665);
--sidebar-primary-foreground: oklch(0.985 0.002 247.839);
--sidebar-accent: oklch(0.967 0.003 264.542);
--sidebar-accent-foreground: oklch(0.21 0.034 264.665);
--sidebar-border: oklch(0.928 0.006 264.531);
--sidebar-ring: oklch(0.707 0.022 261.325);
}

.dark {
--background: oklch(0.13 0.028 261.692);
--foreground: oklch(0.985 0.002 247.839);
--card: oklch(0.21 0.034 264.665);
--card-foreground: oklch(0.985 0.002 247.839);
--popover: oklch(0.21 0.034 264.665);
--popover-foreground: oklch(0.985 0.002 247.839);
--primary: oklch(0.928 0.006 264.531);
--primary-foreground: oklch(0.21 0.034 264.665);
--secondary: oklch(0.278 0.033 256.848);
--secondary-foreground: oklch(0.985 0.002 247.839);
--muted: oklch(0.278 0.033 256.848);
--muted-foreground: oklch(0.707 0.022 261.325);
--accent: oklch(0.278 0.033 256.848);
--accent-foreground: oklch(0.985 0.002 247.839);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.551 0.027 264.364);
--sidebar: oklch(0.21 0.034 264.665);
--sidebar-foreground: oklch(0.985 0.002 247.839);
--sidebar-primary: oklch(0.985 0.002 247.839);
--sidebar-primary-foreground: oklch(0.21 0.034 264.665);
--sidebar-accent: oklch(0.278 0.033 256.848);
--sidebar-accent-foreground: oklch(0.985 0.002 247.839);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.551 0.027 264.364);
}
Slate
styles.css

:root {
--radius: 0.625rem;
--background: oklch(1 0 0);
--foreground: oklch(0.129 0.042 264.695);
--card: oklch(1 0 0);
--card-foreground: oklch(0.129 0.042 264.695);
--popover: oklch(1 0 0);
--popover-foreground: oklch(0.129 0.042 264.695);
--primary: oklch(0.208 0.042 265.755);
--primary-foreground: oklch(0.984 0.003 247.858);
--secondary: oklch(0.968 0.007 247.896);
--secondary-foreground: oklch(0.208 0.042 265.755);
--muted: oklch(0.968 0.007 247.896);
--muted-foreground: oklch(0.554 0.046 257.417);
--accent: oklch(0.968 0.007 247.896);
--accent-foreground: oklch(0.208 0.042 265.755);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.929 0.013 255.508);
--input: oklch(0.929 0.013 255.508);
--ring: oklch(0.704 0.04 256.788);
--sidebar: oklch(0.984 0.003 247.858);
--sidebar-foreground: oklch(0.129 0.042 264.695);
--sidebar-primary: oklch(0.208 0.042 265.755);
--sidebar-primary-foreground: oklch(0.984 0.003 247.858);
--sidebar-accent: oklch(0.968 0.007 247.896);
--sidebar-accent-foreground: oklch(0.208 0.042 265.755);
--sidebar-border: oklch(0.929 0.013 255.508);
--sidebar-ring: oklch(0.704 0.04 256.788);
}

.dark {
--background: oklch(0.129 0.042 264.695);
--foreground: oklch(0.984 0.003 247.858);
--card: oklch(0.208 0.042 265.755);
--card-foreground: oklch(0.984 0.003 247.858);
--popover: oklch(0.208 0.042 265.755);
--popover-foreground: oklch(0.984 0.003 247.858);
--primary: oklch(0.929 0.013 255.508);
--primary-foreground: oklch(0.208 0.042 265.755);
--secondary: oklch(0.279 0.041 260.031);
--secondary-foreground: oklch(0.984 0.003 247.858);
--muted: oklch(0.279 0.041 260.031);
--muted-foreground: oklch(0.704 0.04 256.788);
--accent: oklch(0.279 0.041 260.031);
--accent-foreground: oklch(0.984 0.003 247.858);
--destructive: oklch(0.704 0.191 22.216);
--border: oklch(1 0 0 / 10%);
--input: oklch(1 0 0 / 15%);
--ring: oklch(0.551 0.027 264.364);
--sidebar: oklch(0.208 0.042 265.755);
--sidebar-foreground: oklch(0.984 0.003 247.858);
--sidebar-primary: oklch(0.984 0.003 247.858);
--sidebar-primary-foreground: oklch(0.208 0.042 265.755);
--sidebar-accent: oklch(0.279 0.041 260.031);
--sidebar-accent-foreground: oklch(0.984 0.003 247.858);
--sidebar-border: oklch(1 0 0 / 10%);
--sidebar-ring: oklch(0.551 0.027 264.364);
}

Use spartan components whenever available using @spartan/components import and source available at angular/packages/spartan/{componentName}. Also, additional detail avaialble at: https://spartan.ng/components/{component-dashed-name-or-folder-name}

For icons import as follows eg.

import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIcon } from '@spartan/components/icon';
import {
lucideLayoutDashboard,
lucidePackage,
lucideShoppingCart,
lucideUsers,
lucideTruck,
lucideShoppingBag,
lucideStore,
lucideSettings,
lucideLogOut
} from '@ng-icons/lucide';
<ng-icon hlm name="lucideStore" size="sm" />

## Component Usage Examples

The following patterns are extracted from actual usage in this repo.

---

### Icon (`@spartan/components/icon`)

Use `HlmIcon` (single import) when you only need one or a few icons. Use spread `...HlmIconImports` when the template uses icons in multiple places.

**TypeScript**
```ts
// Single icon helper
import { HlmIcon } from '@spartan/components/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';

@Component({
  imports: [NgIcon, HlmIcon],
  providers: [provideIcons({ lucideArrowLeft })],
})

// Multiple icons — use spread form
import { HlmIconImports } from '@spartan/components/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideHome, lucideSettings, lucideLogOut } from '@ng-icons/lucide';

@Component({
  imports: [...HlmIconImports],
  providers: [provideIcons({ lucideHome, lucideSettings, lucideLogOut })],
})
```

**HTML**
```html
<ng-icon hlm name="lucideArrowLeft" size="sm" />
<ng-icon hlm name="lucideHome" size="md" />
<!-- size options: "xs" | "sm" | "md" | "lg" | "xl" -->
```

---

### Button (`@spartan/components/button`)

```ts
import { HlmButton } from '@spartan/components/button';
// or spread: import { HlmButtonImports } from '@spartan/components/button';
```

```html
<button hlmBtn>Default</button>
<button hlmBtn variant="outline">Outline</button>
<button hlmBtn variant="ghost">Ghost</button>
<button hlmBtn variant="destructive">Delete</button>
<button hlmBtn variant="secondary">Secondary</button>
<button hlmBtn size="icon"><ng-icon hlm name="lucidePlus" /></button>
<button hlmBtn [disabled]="isLoading()">
  @if (isLoading()) { <hlm-spinner class="mr-2" size="sm" /> }
  Save
</button>
```

---

### Badge (`@spartan/components/badge`)

```ts
import { HlmBadge } from '@spartan/components/badge';
// or spread: import { HlmBadgeImports } from '@spartan/components/badge';
```

```html
<span hlmBadge>Default</span>
<span hlmBadge variant="secondary">Secondary</span>
<span hlmBadge variant="destructive">Error</span>
<span hlmBadge variant="outline">Outline</span>
<!-- Dynamic variant -->
<span hlmBadge [variant]="statusBadgeVariant(task.status)">{{ task.status }}</span>
```

---

### Card (`@spartan/components/card`)

```ts
import { HlmCard, HlmCardContent, HlmCardHeader, HlmCardTitle, HlmCardDescription } from '@spartan/components/card';
// or spread: import { HlmCardImports } from '@spartan/components/card';
```

```html
<section hlmCard>
  <div hlmCardHeader>
    <h3 hlmCardTitle>Title</h3>
    <p hlmCardDescription>Description text</p>
  </div>
  <div hlmCardContent>
    Content goes here
  </div>
</section>

<!-- Card as a list item -->
<div section hlmCard class="member-card">
  ...
</div>
```

---

### Input & Label (`@spartan/components/input`, `@spartan/components/label`)

```ts
import { HlmInput } from '@spartan/components/input';
import { HlmLabelImports } from '@spartan/components/label';
// or: import { HlmInputImports } from '@spartan/components/input';
```

```html
<label hlmLabel for="email" class="mb-2 block">Email</label>
<input hlmInput id="email" type="email" placeholder="you@example.com" class="w-full" />
```

---

### Spinner (`@spartan/components/spinner`)

```ts
import { HlmSpinner } from '@spartan/components/spinner';
// or spread: import { HlmSpinnerImports } from '@spartan/components/spinner';
```

```html
<hlm-spinner size="sm" />
<hlm-spinner class="mr-2 h-4 w-4" aria-hidden="true" />
<!-- Conditional spinner in a button -->
@if (isSaving()) {
  <hlm-spinner class="mr-1.5 h-3.5 w-3.5" />
}
```

---

### Skeleton (`@spartan/components/skeleton`)

```ts
import { HlmSkeletonImports } from '@spartan/components/skeleton';
```

```html
<!-- Spread import required for skeleton — no single-class export -->
<span hlmSkeleton class="h-4 w-3/4"></span>
<span hlmSkeleton class="h-3 w-full"></span>
<span hlmSkeleton class="h-5 w-20 rounded-full"></span>
<span hlmSkeleton class="w-2.5 h-2.5 rounded-full shrink-0"></span>
```

---

### Separator (`@spartan/components/separator`)

```ts
import { HlmSeparator } from '@spartan/components/separator';
// or spread: import { HlmSeparatorImports } from '@spartan/components/separator';
```

```html
<hlm-separator />
```

---

### Avatar (`@spartan/components/avatar`)

```ts
import { HlmAvatarImports } from '@spartan/components/avatar';
```

```html
<hlm-avatar size="default">
  @if (user.photoUrl) {
    <img hlmAvatarImage [src]="user.photoUrl" [alt]="user.displayName ?? 'user'" />
  }
  <span hlmAvatarFallback>{{ initials(user) }}</span>
</hlm-avatar>

<!-- Custom size via class -->
<hlm-avatar class="size-14 shrink-0">
  <img hlmAvatarImage [src]="photoUrl" alt="profile" />
  <span hlmAvatarFallback class="bg-primary/10 text-primary">{{ initials }}</span>
</hlm-avatar>
```

---

### Dialog (`@spartan/components/dialog`)

Use `*hlmDialogPortal` on `<hlm-dialog-content>` to render into the overlay. Control open/close via `[state]` binding.

```ts
import { HlmDialogImports } from '@spartan/components/dialog';
```

```html
<hlm-dialog
  [state]="isOpen() ? 'open' : 'closed'"
  (stateChanged)="$event === 'closed' && onClose()"
>
  <hlm-dialog-content *hlmDialogPortal class="w-full max-w-md p-6 space-y-4">
    <hlm-dialog-header>
      <h2 hlmDialogTitle>Dialog Title</h2>
    </hlm-dialog-header>

    <!-- content -->

    <hlm-dialog-footer class="justify-end gap-2 pt-2">
      <button hlmBtn variant="ghost" (click)="onClose()">Cancel</button>
      <button hlmBtn (click)="onConfirm()">Confirm</button>
    </hlm-dialog-footer>
  </hlm-dialog-content>
</hlm-dialog>
```

**Programmatic dialog via `HlmDialogService`:**
```ts
import { HlmDialogService } from '@spartan/components/dialog';

private readonly _dialogService = inject(HlmDialogService);

openDialog() {
  this._dialogService.open(MyDialogContentComponent, { data: { ... } });
}
```

---

### Alert Dialog (`@spartan/components/alert-dialog`)

Use for destructive confirmations. Content is rendered lazily via `<ng-template hlmAlertDialogPortal>`.

```ts
import { HlmAlertDialogImports } from '@spartan/components/alert-dialog';
```

```html
<hlm-alert-dialog
  [state]="showConfirm() ? 'open' : 'closed'"
  (closed)="showConfirm.set(false)"
>
  <ng-template hlmAlertDialogPortal>
    <hlm-alert-dialog-content>
      <hlm-alert-dialog-header>
        <h2 hlmAlertDialogTitle>Are you sure?</h2>
        <p hlmAlertDialogDescription>This action cannot be undone.</p>
      </hlm-alert-dialog-header>
      <hlm-alert-dialog-footer>
        <button hlmAlertDialogCancel (click)="showConfirm.set(false)">Cancel</button>
        <button hlmAlertDialogAction variant="destructive" (click)="onConfirm()">Delete</button>
      </hlm-alert-dialog-footer>
    </hlm-alert-dialog-content>
  </ng-template>
</hlm-alert-dialog>
```

---

### Sheet (`@spartan/components/sheet`)

Slide-in panel. Use `*hlmSheetPortal` on `<hlm-sheet-content>`. Control via `[state]`.

```ts
import { HlmSheetImports } from '@spartan/components/sheet';
```

```html
<hlm-sheet
  [state]="showSheet() ? 'open' : 'closed'"
  side="right"
  (stateChanged)="onSheetStateChanged($event)"
>
  <hlm-sheet-content *hlmSheetPortal>
    <div hlmSheetHeader>
      <h3 hlmSheetTitle>Sheet Title</h3>
      <p hlmSheetDescription>Supporting description text.</p>
    </div>

    <!-- form / content -->

    <div hlmSheetFooter>
      <button hlmBtn variant="outline" (click)="showSheet.set(false)">Cancel</button>
      <button hlmBtn (click)="onSubmit()">Submit</button>
    </div>
  </hlm-sheet-content>
</hlm-sheet>
```

---

### Select (`@spartan/components/select`)

`<brn-select>` is the brain (from `@spartan-ng/brain`); `hlm-select-*` are the styled wrappers. Use `[ngModel]` / `(ngModelChange)` for two-way binding.

```ts
import { HlmSelectImports } from '@spartan/components/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
```

```html
<brn-select [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)">
  <hlm-select-trigger class="w-full">
    <hlm-select-value />
  </hlm-select-trigger>
  <hlm-select-content>
    <hlm-option value="member">Member</hlm-option>
    <hlm-option value="owner">Owner</hlm-option>
  </hlm-select-content>
</brn-select>
```

---

### Tabs (`@spartan/components/tabs`)

```ts
import { HlmTabsImports } from '@spartan/components/tabs';
```

```html
<hlm-tabs tab="plan">
  <hlm-tabs-list>
    <button hlmTabsTrigger="plan">Plan</button>
    <button hlmTabsTrigger="history">History</button>
  </hlm-tabs-list>

  <div hlmTabsContent="plan">
    <!-- plan content -->
  </div>
  <div hlmTabsContent="history">
    <!-- history content -->
  </div>
</hlm-tabs>
```

---

### Import pattern summary

| Component | Single import | Spread import |
|---|---|---|
| Button | `HlmButton` | `HlmButtonImports` |
| Badge | `HlmBadge` | `HlmBadgeImports` |
| Card | `HlmCard, HlmCardContent, …` | `HlmCardImports` |
| Input | `HlmInput` | `HlmInputImports` |
| Label | `HlmLabel` | `HlmLabelImports` |
| Icon | `HlmIcon` | `HlmIconImports` |
| Spinner | `HlmSpinner` | `HlmSpinnerImports` |
| Skeleton | — | `HlmSkeletonImports` |
| Separator | `HlmSeparator` | `HlmSeparatorImports` |
| Avatar | — | `HlmAvatarImports` |
| Dialog | — | `HlmDialogImports` |
| Alert Dialog | — | `HlmAlertDialogImports` |
| Sheet | — | `HlmSheetImports` |
| Select | — | `HlmSelectImports` |
| Tabs | — | `HlmTabsImports` |
