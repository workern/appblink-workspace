# Workern Monorepo - AI Agent Instructions

## Code Generation Guardrails (MANDATORY)

Before writing any new code, creating any new file, or implementing any feature, you **MUST** call the `#appblink_vibecheck_guardrail` tool first.

- Pass the file paths you plan to create or modify as `filePaths`.
- Pass a short description of what you are implementing as `taskDescription`.
- Read every rule in the response and follow them for the entire task.
- Do **not** skip this step, even for small changes or single-file edits.

## Architecture

Multi-platform monorepo: Angular (web) + Flutter (mobile) + Firebase Cloud Functions (backend) + Firestore.

- **Models**: TypeScript in `libs/shared/models/`, Dart mirror in `flutter/packages/workern_models/` — always keep in sync.
- **Firestore mutations**: always go through Cloud Functions (`tools/firebase/functions-ts/src/`), never write directly from frontend.
- **Shared packages**: `angular/packages/`, `flutter/packages/`, `libs/shared/` — search here before creating anything.

## Cross-Platform Sync (CRITICAL)

Angular ↔ Flutter app pairs:

- `angular/apps/nikat` ↔ `flutter/apps/nikat`
- `angular/apps/nikat-shop-manager` ↔ `flutter/apps/sangrah`
- `angular/apps/workern-admin` ↔ `flutter/apps/sangrah-admin`

After any change to one platform, proactively apply the same change to its pair unless told otherwise. For models/types: always sync TypeScript + Dart together.

## Firestore Patterns

Every document lives at 3 paths — always write all three in a transaction:

```
apps/{appId}/{collection}/{docId}                          # global
users/{userId}/mySpaces/{appId}/{collection}/{docId}       # user view
users/{ownerId}/mySpaces/{appId}/{collection}/{docId}      # owner view
```

Get app IDs from the `APPID` enum, not hardcoded strings. Update `tools/firebase/firestore.rules` for every new collection.

## Angular Rules

- Signals only for state: `signal()`, `computed()` — no `BehaviorSubject` for UI state.
- Standalone components only — no `@NgModule`.
- `inject()` function — no constructor injection.
- `ChangeDetectionStrategy.OnPush` on every component.
- Native control flow: `@if`, `@for`, `@switch` — not `*ngIf`, `*ngFor`.
- `input()` / `output()` signals — not `@Input()` / `@Output()` decorators.
- Separate `.html` and `.css` files — no inline template/styles.
- UI: use `angular/packages/spartan/{component}` — check there first. Icons via spartan icon + `@ng-icons/lucide`.
- Imports: `@workern/models`, `@workern/services`, `@workern/components`, `@workern/guards` — no relative imports for these.
- Firestore reads: use `angular/packages/services/src/lib/firestore.service.ts` — never raw Firebase SDK.
- Monetary fields: use `Amount` from `@workern/models`. Display with `amount-display` pipe.

## Flutter Rules

- Riverpod only for state — no Provider, no setState for shared state.
- `ref.invalidate(provider)` after every write.
- Auth: `flutter/packages/workern_auth`. UI components: `flutter/packages/workern_widgets`. Services: `flutter/packages/workern_services`.
- Cloud Function calls: `CloudFunctionsService` from `workern_services`.

## Firebase Functions Rules

- Region: `asia-south2`.
- Function names: full lowercase (e.g. `createorder`, `addshopitem`).
- Validate all input with Zod before any business logic.
- Use `db` from `tools/firebase/functions-ts/src/global.ts`.
- Error: `throw new HttpsError('invalid-argument', 'message')`.

## Models Rules

- All Firestore models extend `BaseModel` (`libs/shared/models/src/lib/interfaces/base.model.ts` / `flutter/packages/workern_models/lib/base_model.dart`) — gives `id`, `createdAt`, `updatedAt`.
- Use enums for status/type fields — never hardcoded strings. Capitalize enum values.
- **App-specific models/interfaces must go in the `apps/` subfolder**: `libs/shared/models/src/lib/apps/{app-name}/` (TypeScript) and `flutter/packages/workern_models/lib/apps/{app_name}/` (Dart). Never place app-specific types in the root `interfaces/`, `models/`, or `enums/` folders — those are for truly cross-app shared types only.
## File Size Limits

- Angular `.html`: max ~200 lines — extract sub-components.
- Angular `.ts`: max ~250 lines — split at >5 signals or >8 methods.
- Flutter `.dart`: max ~350 lines — extract widgets into `widgets/` subfolder.

When a file would exceed these limits, automatically split it — extract the largest logical section first.
