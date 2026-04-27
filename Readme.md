
# AppBlink Workspace

> Public starter workspace for building and shipping apps with **Angular** (web) and **Flutter** (mobile), backed by **Firebase**.

![Angular](https://img.shields.io/badge/Angular-20+-DD0031?logo=angular&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter-stable-02569B?logo=flutter&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-ready-FFCA28?logo=firebase&logoColor=black)
![NX](https://img.shields.io/badge/NX-monorepo-143055?logo=nx&logoColor=white)

---

## What's inside

| Layer | Stack |
|-------|-------|
| Web app | Angular 20+, Tailwind CSS, NX |
| Mobile app | Flutter (stable), Riverpod |
| Backend | Firebase (Auth, Firestore, Functions, Storage) |
| Monorepo tooling | NX workspace |

All Firebase config files ship with **placeholders only** — no real keys are committed.

---

## Prerequisites

- **Node.js** 20+  
- **npm** 10+  
- **Flutter** stable channel  
- **Firebase CLI**

```bash
npm install -g firebase-tools
```

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

Pick your project from the list, then fill in the placeholders across these files:

| File | Purpose |
|------|---------|
| `angular/apps/starter-app/src/environments/environment.ts` | Angular dev config |
| `angular/apps/starter-app/src/environments/environment.prod.ts` | Angular prod config |
| `flutter/apps/starter_app/lib/firebase_options.dart` | Flutter Firebase options |
| `flutter/apps/starter_app/android/app/google-services.json` | Android Firebase config |

> You can also download a fresh `google-services.json` directly from the Firebase Console for your Android app.

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

---

## Firebase setup notes

- Use the **same Firebase project** for both web and mobile to keep things simple.
- Keep `.env.local` and `.secret.local` out of git — they are already in `.gitignore`.
- Never commit real API keys, tokens, or secrets.
- Restrict Firebase API keys by platform and app in the Firebase Console.

---

## Security checklist

Before pushing your own fork or changes:

- [ ] All `YOUR_*` placeholders have been replaced locally (not committed)
- [ ] `.env.local` and `.secret.local` are not tracked by git
- [ ] No real keys appear in any committed file
- [ ] Any previously exposed key has been rotated in the Firebase / GCP Console

---

## Troubleshooting

**`firebase projects:list` fails**  
→ Run `firebase login` again and re-authenticate.

**Flutter cannot connect to Firebase**  
→ Re-check that `google-services.json` was downloaded for the correct Android package name.

**Angular runtime config errors**  
→ Verify all required Firebase fields are filled in both `environment.ts` and `environment.prod.ts`.

---

## License

MIT — use freely for your own projects.