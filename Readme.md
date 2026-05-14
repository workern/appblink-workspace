# AppBlink Workspace

> Ship full-stack apps faster. Angular web, Flutter mobile, and Firebase backend — production-ready, in one monorepo.

<!-- Replace the line below with your actual screenshot or demo GIF -->
![AppBlink demo screenshot](https://via.placeholder.com/900x500?text=Add+a+screenshot+or+demo+GIF+here)

![Angular](https://img.shields.io/badge/Angular-21+-DD0031?logo=angular&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter-stable-02569B?logo=flutter&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-ready-FFCA28?logo=firebase&logoColor=black)
![NX](https://img.shields.io/badge/NX-monorepo-143055?logo=nx&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Riverpod](https://img.shields.io/badge/Riverpod-3-00BCD4?logo=flutter&logoColor=white)
[![VS Code Extension](https://img.shields.io/visual-studio-marketplace/v/workern.appblink?label=VS%20Code%20Extension&logo=visualstudiocode&logoColor=white&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=workern.appblink)

If this saves you time, please **⭐ star the repo** — it helps others find it.

---

## Why we built this

We got tired of rebuilding the same Angular + Flutter + Firebase architecture from scratch for every client project. AppBlink Workspace is the monorepo we wished existed: auth, billing, notifications, CI, emulators, and 50+ UI components — all wired up and ready to ship from day one.

---

## VS Code Extension

[![Install AppBlink for VS Code](https://img.shields.io/visual-studio-marketplace/v/workern.appblink?label=Install+for+VS+Code&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=workern.appblink)

The **[AppBlink VS Code extension](https://marketplace.visualstudio.com/items?itemName=workern.appblink)** is purpose-built for this workspace:

- One-click scaffolding, code generation, and feature wiring across Angular and Flutter
- Context-aware suggestions that understand this monorepo's structure
- Streamlined Firebase configuration, emulator management, and deployment
- Integrated AI assistance trained on this workspace's conventions

---

## What's inside

| Layer | Stack |
|-------|-------|
| Web app | Angular 21, Tailwind CSS v4, SSR, PWA |
| Mobile app | Flutter (stable), Riverpod 3, shadcn_ui |
| Backend | Firebase (Auth, Firestore, Functions, Storage, Extensions) |
| Cloud Functions | TypeScript + Python |
| UI components | Spartan/shadcn-style headless component library (50+ components) |
| Monorepo tooling | NX 22 |

All Firebase config files ship with **placeholders only** — no real credentials are ever committed.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/workern/appblink-workspace.git
cd appblink-workspace
npm install
```

### 2. Connect to Firebase

```bash
firebase login
firebase projects:list
```

Fill in the Firebase placeholders in these files:

| File | Purpose |
|------|---------|
| `angular/apps/starter-app/src/environments/environment.ts` | Angular dev config |
| `angular/apps/starter-app/src/environments/environment.prod.ts` | Angular prod config |
| `flutter/apps/starter_app/lib/firebase_options.dart` | Flutter Firebase options |
| `flutter/apps/starter_app/android/app/google-services.json` | Android Firebase config |
| `flutter/apps/starter_app/ios/Runner/GoogleService-Info.plist` | iOS Firebase config |

> Download `GoogleService-Info.plist` from the Firebase Console → your iOS app → **Download GoogleService-Info.plist**. Place it at `flutter/apps/starter_app/ios/Runner/GoogleService-Info.plist`. This file is gitignored and must never be committed.

### 3. Run the web app

```bash
nx serve ng-starter-app
```

### 4. Run the mobile app

```bash
cd flutter/apps/starter_app
flutter pub get
flutter run
```

### 5. Start Firebase emulators

```bash
npm run emulators
```

This starts Auth, Firestore, Functions, Storage, and Extensions locally with data persistence between sessions.

---

## Features

### Angular Web App (`ng-starter-app`)
- **Angular 21** with Server-Side Rendering (SSR) and hydration
- **Progressive Web App** (PWA) with service worker and offline support
- **Tailwind CSS v4** with a full design system
- **i18n / localization** with `@ngx-translate` and per-component translation files
- **Authentication** — sign-in, sign-up, magic link, social login flows
- **Billing & payments** — subscription plans, payment dialogs, order status
- **Onboarding stepper** — guided multi-step user onboarding
- **SEO service** — meta tags, Open Graph, canonical URLs
- **Media upload** — image/file upload with Firebase Storage
- **Google Maps & Places** integration
- **PWA install prompt** and app update notifications
- **Dynamic forms** — schema-driven form rendering
- **Search** — Algolia and Typesense integration

### Angular Packages
| Package | Contents |
|---------|----------|
| `ng-components` | Billing, auth UI, profile, payments, dynamic forms, language switcher, WhatsApp connect, working hours editor, and more |
| `ng-services` | Auth, Firestore, Storage, Analytics, SEO, i18n, billing, media upload, location, Places, Algolia, Typesense, Razorpay, PWA, Snackbar, and more |
| `ng-guards` | Route guards for auth, roles, and feature flags |
| `ng-pipes` | Custom Angular pipes for formatting and transformation |
| `ui-helm` | 50+ headless Spartan/shadcn-style UI components: accordion, avatar, badge, breadcrumb, button, calendar, carousel, checkbox, combobox, date picker, dialog, dropdown, input, pagination, select, sidebar, table, tabs, toast, and more |

### Flutter Mobile App (`starter_app`)
- **Flutter stable** with clean architecture and Riverpod state management
- **shadcn_ui** component library for a consistent, polished UI
- **Firebase Auth** — authentication flows out of the box
- **Push notifications** with Firebase Cloud Messaging
- **go_router** for declarative, nested navigation
- **Native splash screen** and launcher icons pre-configured

### Flutter Packages (13 packages)
| Package | Purpose |
|---------|---------|
| `workern_auth` | Authentication — Firebase Auth, session management |
| `workern_services` | Firestore, Storage, Analytics, App Check, Remote Config, Cloud Functions |
| `workern_models` | Shared data models with Equatable and Firestore serialization |
| `workern_widgets` | Reusable UI widgets and shared layout components |
| `workern_ai` | AI-powered features and integrations |
| `workern_billing` | In-app purchases and subscription billing |
| `workern_media` | Image upload, video player, camera/photo library access |
| `workern_notifications` | Push notifications with FCM |
| `workern_localization` | i18n and multi-language support |
| `workern_location` | Device location and geolocation services |
| `workern_referral` | Referral system and invite flows |
| `workern_tracking` | Analytics and event tracking |
| `workern_utils` | Shared utilities and helpers |

### Firebase Backend
- **TypeScript Cloud Functions** — auth triggers, billing webhooks, notifications, data functions, OAuth2, marketing attribution, phone utilities, and more
- **Python Cloud Functions** — Python-based serverless workloads
- **Firestore** — rules, indexes, and helpers pre-configured
- **Firebase Storage** — CORS config and security rules
- **Realtime Database** — rules included
- **Firebase Extensions** — Firestore auth claims, email sending, invite-to-space email
- **Firebase Emulators** — full local dev environment with persisted data (Auth, Firestore, Functions, Storage)

### Payment Providers
Chargebee · Razorpay · LemonSqueezy · Dodo Payments · RazorpayX

### Communication Integrations
SendGrid · Nodemailer · Zeptomail · Firebase Cloud Messaging

### Third-party Integrations
Google Analytics · Algolia · Typesense · Sentry · Google Maps · Google Places · Gemini AI (Firebase AI) · Google APIs

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Flutter | stable channel |
| Firebase CLI | latest |

```bash
npm install -g firebase-tools
```

---

## Monorepo structure

```
appblink-workspace/
├── angular/
│   ├── apps/starter-app/        # Angular SSR + PWA web app
│   └── packages/
│       ├── components/          # Shared Angular components
│       ├── services/            # Shared Angular services
│       ├── guards/              # Route guards
│       ├── pipes/               # Custom pipes
│       └── spartan/             # 50+ headless UI components
├── flutter/
│   ├── apps/starter_app/        # Flutter mobile app
│   └── packages/                # 13 Flutter feature packages
├── tools/
│   └── firebase/
│       ├── functions-ts/        # TypeScript Cloud Functions
│       ├── functions-py/        # Python Cloud Functions
│       ├── firestore.rules      # Firestore security rules
│       └── storage.rules        # Storage security rules
└── libs/
    └── shared/                  # Shared models and utilities
```

---

## Useful commands

| Command | Description |
|---------|-------------|
| `nx serve ng-starter-app` | Start Angular dev server |
| `npm run starter-app` | Alias for the above |
| `npm run emulators` | Start all Firebase emulators |
| `npm run build:ng` | Build Angular for production |
| `npm run analyze:flutter` | Analyze Flutter code |

---

## Firebase setup notes

- Use the **same Firebase project** for both web and mobile.
- Keep `.env.local` and `.secret.local` out of git — they are already in `.gitignore`.
- Never commit real API keys, tokens, or secrets.
- Restrict Firebase API keys by platform in the Firebase Console.

---

## Security checklist

Before pushing your own fork or changes:

- [ ] All `YOUR_*` placeholders have been replaced locally (not committed)
- [ ] `.env.local` and `.secret.local` are not tracked by git
- [ ] No real keys appear in any committed file
- [ ] Any previously exposed key has been rotated in the Firebase / GCP Console
- [ ] Firestore rules are locked down for your use case
- [ ] Firebase Storage rules are configured correctly

---

## Troubleshooting

**`firebase projects:list` fails**  
→ Run `firebase login` again and re-authenticate.

**Flutter cannot connect to Firebase**  
→ Re-check that `google-services.json` was downloaded for the correct Android package name.

**Angular runtime config errors**  
→ Verify all required Firebase fields are filled in both `environment.ts` and `environment.prod.ts`.

**Emulators fail to start**  
→ Run `npx gulp kill-ports` first to free up any occupied ports, then retry.

---

## Contributing

Issues and pull requests are welcome! If you're using AppBlink Workspace in a project, we'd love to hear about it — open a discussion or drop a note in the issues tab.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a pull request

---

## License

MIT — use freely for your own projects.

---

> If AppBlink Workspace saved you hours of setup, consider giving it a ⭐ — it helps others find the project.
