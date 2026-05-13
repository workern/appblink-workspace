---
applyTo: 'extensions/**/*.{ts,js,json,md}'
---

# VS Code Extension Agent Instructions

Use these rules when making changes inside any VS Code extension under `extensions/`.

---

## 1. File Size & Single Responsibility

- **Hard cap: 300 lines per file.** If a file would exceed this, split it before writing any code.
- **One concern per file.** A file registers commands OR implements logic OR defines types — never all three.
- **Never grow an existing large file.** If the target file is already over 300 lines, extract the new logic into a new focused file and import it. Do not append to the bloated file.
- `treeProvider.ts`, `extension.ts`, `*Commands.ts` files over 300 lines are a bug — split them proactively when touching them.

**Allowed split strategies:**

| Situation                | Split pattern                                                     |
| ------------------------ | ----------------------------------------------------------------- |
| Command file > 300 lines | One file per feature domain, under `commands/{domain}/`           |
| Service file > 300 lines | Extract sub-concerns: `*Reader.ts`, `*Writer.ts`, `*Validator.ts` |
| Types file > 300 lines   | Group by domain: `types/{domain}.types.ts`                        |
| TreeProvider > 300 lines | One provider class per tree, under `treeProviders/`               |

---

## 2. Architecture: Separation of Concerns

Follow this strict layering. Never skip a layer or merge two layers into one file.

```
extension.ts          ← activation only: register disposables, wire providers
  └── commands/       ← thin command handlers: parse args, call service, show result
        └── services/ ← all business logic: pure functions + stateful services
              └── utils/ ← helpers with zero VS Code API imports (fully unit-testable)
```

**Rules per layer:**

- **`extension.ts`**: Only `activate()` / `deactivate()`. No business logic. No inline command implementations. Target < 100 lines.
- **`commands/*.ts`**: Register and dispatch only. A command handler must not exceed 20 lines. Extract everything else into a service.
- **`services/*.ts`**: Business logic. No `vscode.window.show*` calls (these belong in commands). Return results; do not display them.
- **`utils/*.ts`**: Pure helper functions. Zero `vscode` imports allowed. These must be unit-testable without a VS Code host.

---

## 3. Command Registration Pattern

Always use a `register*Commands(context)` factory function. Never register commands ad hoc inside `extension.ts`.

```typescript
// commands/foo/fooCommands.ts
import * as vscode from 'vscode';
import { fooService } from '../../services/fooService';

export function registerFooCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('appblink.doFoo', async (item) => {
      try {
        const result = await fooService.execute(item);
        vscode.window.showInformationMessage(result.message);
      } catch (err) {
        vscode.window.showErrorMessage(`Foo failed: ${(err as Error).message}`);
      }
    })
  );
}
```

- Every `registerCommand` call must be pushed to `context.subscriptions` — no exceptions.
- Command handlers must be `async` and wrapped in `try/catch`.

---

## 4. Service Design for Testability

- Services must be **plain classes or objects with explicit interfaces** — no singletons that capture VS Code state.
- Inject all external dependencies (filesystem, VS Code API, config) through the constructor or function parameters — never import them inside service methods.
- Keep **pure functions** in `utils/` and **stateful wrappers** in `services/`. This makes pure logic trivially unit-testable.

```typescript
// GOOD — injectable, testable
export class ReleaseService {
  constructor(
    private readonly fs: typeof import('fs'),
    private readonly workspaceRoot: string
  ) {}

  readVersion(): string {
    /* only uses this.fs, this.workspaceRoot */
  }
}

// BAD — hard-coded globals, cannot be tested in isolation
export async function readVersion() {
  const root = vscode.workspace.workspaceFolders![0].uri.fsPath;
  return fs.readFileSync(path.join(root, 'pubspec.yaml'), 'utf8');
}
```

---

## 5. TypeScript Strictness

- All files must compile with `"strict": true`. No `any` unless wrapping a third-party API with no types.
- Use `unknown` instead of `any` for caught errors: `catch (err) { const msg = (err as Error).message; }`
- Define explicit return types on every exported function and class method.
- Prefer `readonly` for properties that are never reassigned.
- Use discriminated unions over optional properties for variant shapes.

---

## 6. Disposable & Resource Management

- Every `FileSystemWatcher`, `OutputChannel`, `StatusBarItem`, `WebviewPanel`, and `TreeView` **must** be added to `context.subscriptions` or disposed manually in `deactivate()`.
- Use `vscode.Disposable.from(...items)` to group related disposables.
- Never create a watcher or channel inside a loop without disposing the previous one first.

```typescript
// Pattern: disposable group
function setupWatcher(context: vscode.ExtensionContext, pattern: string): void {
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(handler, null, context.subscriptions);
  context.subscriptions.push(watcher);
}
```

---

## 7. Error Handling

- Every `async` command handler must have a top-level `try/catch` that shows a `vscode.window.showErrorMessage`.
- Services must throw typed errors (`throw new Error('...')`) — never swallow exceptions silently.
- Never `console.log` in extension code. Use the shared `logExtension()` from `utils/logger.ts`.
- For long operations, always use `vscode.window.withProgress` — never fire-and-forget without user feedback.

---

## 8. Naming Conventions

| Artifact            | Convention                   | Example                |
| ------------------- | ---------------------------- | ---------------------- |
| Command file        | `{domain}Commands.ts`        | `releaseCommands.ts`   |
| Service file        | `{domain}Service.ts`         | `releaseService.ts`    |
| Type/interface file | `{domain}.types.ts`          | `release.types.ts`     |
| TreeProvider file   | `{domain}TreeProvider.ts`    | `appsTreeProvider.ts`  |
| Util file           | `{concern}Utils.ts`          | `pathUtils.ts`         |
| VS Code command ID  | `appblink.{camelCaseAction}` | `appblink.bumpVersion` |

- Use `PascalCase` for classes and interfaces.
- Use `camelCase` for functions and variables.
- Prefix private class members with nothing (TypeScript `private` keyword is sufficient).

---

## 9. Barrel Files

- Every `commands/`, `services/`, `utils/` folder must have an `index.ts` barrel that re-exports public symbols.
- Consumers import from the barrel (`'../services'`) — not from deep module paths.
- The barrel itself does no logic — it only re-exports.

---

## 10. Testing-Friendly Patterns

- All logic that can run outside VS Code (string parsing, path manipulation, JSON transforms, validation) goes in `utils/` with **zero** `vscode` imports.
- For each new service, identify the pure-function core and extract it to `utils/` so it can be tested with plain `node`.
- Avoid `Date.now()`, `Math.random()`, and global state inside service logic — accept them as parameters instead.

---

## 11. Mandatory Release Step (Every Change Set)

After completing **each set of code changes** in an extension:

1. **Update the extension version** in that extension's `package.json`.
   - Use semantic versioning.
   - Default to a patch bump unless explicitly told otherwise.
2. **Package the extension** from that extension directory.
   - Run: `npx vsce package` (creates `.vsix`)
3. **Clean up old VSIX artifacts** in that extension directory.
   - Keep only the latest **2** `.vsix` files.
   - Delete `.vsix` files older than those latest 2 versions.
4. **Report outcome** in the final response.
   - Mention the new version.
   - Confirm `.vsix` packaging success/failure.

---

## 12. Scope Notes

- Apply all rules per extension (e.g., `extensions/appblink`).
- Do not skip version bump or packaging, even for small fixes, unless the user explicitly says not to package.
- If packaging fails, include the error summary and proposed fix, then retry after fixing.
- When in doubt about where new code belongs, prefer a new focused file over adding lines to an existing one.

## 13. DRY Principle

- If you find yourself writing the same code more than once, extract it to a shared utility function in `utils/`.
- Avoid copy-pasting code between services; instead, identify the common logic and abstract it.
- We have some reusable prompt templates in `extensions/appblink/src/utils/prompts.ts` — use them for consistency in AI interactions.

## 14. App Design Tokens Access (App Blink)

- Never build app token JSON paths manually with `path.join(..., 'design-system', 'apps', ...)` in command/service code.
- Never read app token JSON directly with `fs.readFileSync` + `JSON.parse` in command/service code.
- Always use the shared helper in `extensions/appblink/src/utils/appDesignTokens.ts`:
  - `getAppDesignTokensPath(workspaceRoot, appId)`
  - `getAppDesignTokens(workspaceRoot, appId)`
  - `getAppDesignTokensOrEmpty(workspaceRoot, appId)`
- If this helper does not satisfy a new use case, extend the helper instead of introducing a new per-file implementation.
