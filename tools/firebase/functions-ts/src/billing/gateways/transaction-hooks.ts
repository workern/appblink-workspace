/**
 * Transaction hook registry for billing/gateways/common.ts.
 *
 * Strategy A — App-side registration pattern:
 * Each app registers its own post-transaction handler here. The billing
 * gateway (common.ts / razorpay.ts / lemonsqueezy.ts) never imports from
 * individual app folders — it only calls the hooks that have been registered
 * by the time a transaction fires.
 *
 * ## Registration
 * In each app's billing-hook.ts file, call `registerTransactionSuccessHook`,
 * `registerTransactionFailedHook`, and/or `registerPostWebhookHook` with the
 * relevant TransactionReason(s). The hook module must be imported once from
 * `src/index.ts` so the registration executes at cold-start time.
 *
 * ## Execution order
 * Hooks for the same reason run sequentially in registration order.
 * If a hook throws, it will propagate and fail the overall transaction handling
 * (treat it like any other unhandled promise rejection in onTransactionSuccessful).
 */

import { Transaction } from '../../models/transactions/transaction';
import { TransactionReason } from '../../enums/transactions/transaction-reason';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The data passed to a post-success hook that runs inside the Firestore
 * transaction (via `db.runTransaction`). The hook receives the Firestore
 * transaction object `t` so it can enqueue reads and writes atomically.
 */
export interface TransactionSuccessContext {
  /** The fully-loaded transaction model. */
  transaction: Transaction;
  /** Raw gateway webhook / API payload. */
  gatewayData: any;
  /** The Firestore transaction object. Use t.get / t.update / t.create / t.set. */
  t: FirebaseFirestore.Transaction;
  /** Lang code for error messages (default: 'en'). */
  langCode: string;
}

/**
 * Handler that runs *inside* the Firestore transaction.
 * Return any additional data you want passed to the `PostSuccessHook`.
 */
export type InTransactionSuccessHook = (
  ctx: TransactionSuccessContext
) => Promise<Record<string, any> | void>;

/**
 * Handler that runs *after* the Firestore transaction commits successfully.
 * Receives the result returned by its paired `InTransactionSuccessHook`.
 */
export type PostSuccessHook = (
  transaction: Transaction,
  result: Record<string, any>
) => Promise<void>;

/**
 * Combined hook pair registered per TransactionReason.
 * Either field is optional — omit whichever phase you don't need.
 */
export interface TransactionSuccessHook {
  /** Runs inside db.runTransaction — can enqueue Firestore ops atomically. */
  inTransaction?: InTransactionSuccessHook;
  /** Runs after the transaction commits — for side-effects like notifications. */
  postCommit?: PostSuccessHook;
}

export interface TransactionFailedContext {
  transaction: Transaction;
  gatewayData: any;
  t: FirebaseFirestore.Transaction;
  langCode: string;
}

export type InTransactionFailedHook = (
  ctx: TransactionFailedContext
) => Promise<void>;

// ─── Post-webhook hook (gateway-level, after onTransactionSuccessful) ─────────

/**
 * The gateway name that fired the webhook — lets a hook normalise
 * gateway-specific payload shapes (e.g. extracting buyer email).
 */
export type WebhookGateway = 'razorpay' | 'lemonsqueezy';

/**
 * Context passed to a postWebhook hook.
 * `gatewayData` is the raw webhook body (varies per gateway).
 * `gateway` identifies which payment processor fired the event.
 */
export interface PostWebhookContext {
  /** The finalised transaction (state already set to SUCCESSFUL by this point). */
  transaction: Transaction;
  /** Raw webhook payload from the gateway. */
  gatewayData: any;
  /** Which payment processor triggered the webhook. */
  gateway: WebhookGateway;
}

/**
 * Handler called by gateway webhook files after `onTransactionSuccessful`
 * completes. Use this for logic that requires the raw gateway payload
 * (e.g. buyer email that only arrives in the payment entity, not in notes).
 */
export type PostWebhookHook = (ctx: PostWebhookContext) => Promise<void>;

// ─── Registries ───────────────────────────────────────────────────────────────

const successHooks = new Map<TransactionReason, TransactionSuccessHook[]>();
const failedHooks = new Map<TransactionReason, InTransactionFailedHook[]>();
const postWebhookHooks = new Map<TransactionReason, PostWebhookHook[]>();

/**
 * Register a success hook for one or more TransactionReasons.
 * Call this at module init time from each app's billing-hook.ts.
 */
export function registerTransactionSuccessHook(
  reasons: TransactionReason | TransactionReason[],
  hook: TransactionSuccessHook
): void {
  const list = Array.isArray(reasons) ? reasons : [reasons];
  for (const reason of list) {
    if (!successHooks.has(reason)) successHooks.set(reason, []);
    successHooks.get(reason)!.push(hook);
  }
}

/**
 * Register a failed hook for one or more TransactionReasons.
 */
export function registerTransactionFailedHook(
  reasons: TransactionReason | TransactionReason[],
  hook: InTransactionFailedHook
): void {
  const list = Array.isArray(reasons) ? reasons : [reasons];
  for (const reason of list) {
    if (!failedHooks.has(reason)) failedHooks.set(reason, []);
    failedHooks.get(reason)!.push(hook);
  }
}

/**
 * Register a post-webhook hook for one or more TransactionReasons.
 * This hook is called by gateway webhook files after `onTransactionSuccessful`
 * and receives the raw gateway payload so apps can extract gateway-specific
 * data (e.g. buyer email from the payment entity).
 */
export function registerPostWebhookHook(
  reasons: TransactionReason | TransactionReason[],
  hook: PostWebhookHook
): void {
  const list = Array.isArray(reasons) ? reasons : [reasons];
  for (const reason of list) {
    if (!postWebhookHooks.has(reason)) postWebhookHooks.set(reason, []);
    postWebhookHooks.get(reason)!.push(hook);
  }
}

// ─── Execution helpers (called by common.ts) ─────────────────────────────────

/**
 * Run all registered in-transaction success hooks for the given reason.
 * Returns a merged result object from all hooks (later hooks may overwrite
 * keys from earlier ones — structure your hook results to avoid collisions).
 */
export async function runInTransactionSuccessHooks(
  reason: TransactionReason,
  ctx: TransactionSuccessContext
): Promise<Record<string, any>> {
  const hooks = successHooks.get(reason) ?? [];
  let merged: Record<string, any> = {};
  for (const hook of hooks) {
    if (hook.inTransaction) {
      const result = await hook.inTransaction(ctx);
      if (result) merged = { ...merged, ...result };
    }
  }
  return merged;
}

/**
 * Run all registered post-commit success hooks for the given reason.
 */
export async function runPostCommitSuccessHooks(
  reason: TransactionReason,
  transaction: Transaction,
  result: Record<string, any>
): Promise<void> {
  const hooks = successHooks.get(reason) ?? [];
  for (const hook of hooks) {
    if (hook.postCommit) {
      await hook.postCommit(transaction, result);
    }
  }
}

/**
 * Run all registered in-transaction failed hooks for the given reason.
 */
export async function runInTransactionFailedHooks(
  reason: TransactionReason,
  ctx: TransactionFailedContext
): Promise<void> {
  const hooks = failedHooks.get(reason) ?? [];
  for (const hook of hooks) {
    await hook(ctx);
  }
}

/**
 * Run all registered post-webhook hooks for the given reason.
 * Called by gateway webhook files after `onTransactionSuccessful` returns.
 */
export async function runPostWebhookHooks(
  reason: TransactionReason,
  ctx: PostWebhookContext
): Promise<void> {
  const hooks = postWebhookHooks.get(reason) ?? [];
  for (const hook of hooks) {
    await hook(ctx);
  }
}
