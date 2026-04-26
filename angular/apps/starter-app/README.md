# Angular Starter App

A clean Angular starter template using the latest Angular features and best practices.

## Features

- **Angular 20+** with signals and zoneless change detection
- **Standalone components** (no NgModules)
- **Firebase integration** ready (Auth, Firestore, Functions)
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **Progressive Web App** (PWA) ready with service worker configuration

## Project Structure

```
apps/ng-starter-app/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   └── home/              # Home page component
│   │   ├── app.component.ts       # Root component
│   │   ├── app.config.ts          # App configuration
│   │   └── app.routes.ts          # Route definitions
│   ├── environments/
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── project.json
└── tsconfig.json
```

## Getting Started

### Development

Run the Angular app:

```bash
nx serve ng-starter-app
```

The app will be available at `http://localhost:4200`

### Build

Build the app for production:

```bash
nx build ng-starter-app
```

## Customization

### Setting Up Your Color Scheme

The app uses Tailwind CSS for styling. To customize the color scheme:

#### 1. Edit Tailwind Configuration

Update `tailwind.config.js` at the root of your monorepo or create a custom config for this app:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main primary color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        secondary: {
          // Add your secondary colors
        },
        accent: {
          // Add your accent colors
        }
      }
    }
  }
};
```

#### 2. Using CSS Variables

Alternatively, define CSS variables in `src/styles.css`:

```css
:root {
  --color-primary: #0ea5e9;
  --color-secondary: #8b5cf6;
  --color-accent: #f59e0b;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #38bdf8;
    /* ... other dark mode colors */
  }
}
```

Then use them in your components:

```css
.button {
  background-color: var(--color-primary);
}
```

#### 3. Using Tailwind's extend feature

Update `src/styles.css` with Tailwind's @layer directive:

```css
@layer base {
  :root {
    --primary: 210 100% 50%;
    --secondary: 270 95% 60%;
  }
}

@layer utilities {
  .bg-primary {
    background-color: hsl(var(--primary));
  }
}
```

### Firebase Setup (Optional)

If you want to use Firebase:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Update `src/environments/environment.ts` with your Firebase config:

```typescript
export const environment = {
  production: false,
  useEmulators: true,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id'
  }
};
```

3. The app is already configured to use Firebase through `app.config.ts`

### Adding New Pages

1. Create a new component:

```bash
nx g component pages/about --project=ng-starter-app
```

2. Add the route in `app.routes.ts`:

```typescript
{
  path: 'about',
  loadComponent: () =>
    import('./pages/about/about.component').then((m) => m.AboutComponent)
}
```

## Technologies Used

- **Angular 20+** - Modern framework with signals
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Backend services (optional)
- **TypeScript** - Type-safe JavaScript
- **Nx** - Monorepo tooling

## Deployment

### Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login and initialize:

```bash
firebase login
firebase init hosting
```

3. Deploy:

```bash
nx build ng-starter-app --configuration=production
firebase deploy --only hosting
```

### Other Platforms

The built app (in `dist/apps/ng-starter-app`) can be deployed to:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Contributing

This app is part of the Workern monorepo. Follow the monorepo guidelines for contributions.

## License

Copyright © 2026 Workern
