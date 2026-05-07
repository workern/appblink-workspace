/**
 * worktime.ts  (global)
 *
 * Tracks and stores user active-time for any app — VS Code extensions, mobile
 * apps, web apps, etc.  All reporters use the same endpoint; the `appId` field
 * determines where data is stored.
 *
 * Firestore layout
 * ─────────────────
 *   users/{uid}/mySpaces/{appId}/workTime/daily          ← per-user personal history
 *   apps/{appId}/workspaces/{workspaceId}/memberWorkTime/{uid}  ← team analytics (admin-only)
 *
 * POST  /worktime-sync
 *   Body: { appId: string; dailyMs: Record<string, number>; workspaceId?: string }
 *   — Merges daily buckets (max-wins). Dual-writes to user-space + workspace when workspaceId given.
 *   — Data is read back via app-specific functions (e.g. memberefficiency).
 */

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { APPID } from '@workern/models';
import { db, deployOptions } from './global';
import { workspaceRefForApp } from './workspaces';
import { requireAuth, requireMethod } from './workspaces/request-helpers';
import { recordBackendUsage } from './applicationusage';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS_PER_REQUEST = 90;
const ALLOWED_APP_IDS = new Set<string>(Object.values(APPID));

// ─── Firestore helpers ────────────────────────────────────────────────────────

/**
 * users/{uid}/mySpaces/{appId}/workTime  (document)
 * This follows the global monorepo user-space pattern so Firestore rules can
 * scope access to the owning user without app-specific rules.
 */
function userWorkTimeRef(uid: string, appId: string) {
  return db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc(appId)
    .collection('workTime')
    .doc('daily');
}

/**
 * apps/{appId}/workspaces/{workspaceId}/memberWorkTime/{uid}
 * Workspace-scoped path — allows team analytics per workspace.
 */
function workspaceMemberWorkTimeRef(
  appId: string,
  workspaceId: string,
  uid: string
) {
  return workspaceRefForApp(appId, workspaceId)
    .collection('memberWorkTime')
    .doc(uid);
}

// ─── Shared logic (also imported by efficiency.ts, etc.) ─────────────────────

/** Validate and sanitise incoming dailyMs — returns only clean entries. */
export function sanitiseDailyMs(
  incoming: Record<string, unknown>
): Record<string, number> {
  const result: Record<string, number> = {};
  let count = 0;
  for (const [key, value] of Object.entries(incoming)) {
    if (!DAY_KEY_RE.test(key)) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      continue;
    result[key] = Math.round(value);
    count++;
    if (count >= MAX_DAYS_PER_REQUEST) break;
  }
  return result;
}

/**
 * Merge incoming dailyMs into existing stored data using max-wins strategy.
 * Returns the merged record.
 */
export function mergeDailyMs(
  existing: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...existing };
  for (const [day, ms] of Object.entries(incoming)) {
    merged[day] = Math.max(merged[day] ?? 0, ms);
  }
  return merged;
}

/**
 * Sum dailyMs entries that fall within the given window (startMs inclusive).
 * Use this in efficiency / analytics functions.
 */
export function sumDailyMsForWindow(
  dailyMs: Record<string, number>,
  windowStartMs: number
): number {
  let total = 0;
  for (const [day, ms] of Object.entries(dailyMs)) {
    const dayStart = Date.parse(day);
    if (!Number.isNaN(dayStart) && dayStart >= windowStartMs) {
      total += ms;
    }
  }
  return total;
}

/** Read a user's stored dailyMs for an app (user-space path). */
export async function readUserDailyMs(
  uid: string,
  appId: string
): Promise<Record<string, number>> {
  const snap = await userWorkTimeRef(uid, appId).get();
  return (snap.data()?.['dailyMs'] ?? {}) as Record<string, number>;
}

/**
 * Read a member's stored dailyMs scoped to a specific workspace.
 * Use this in workspace-level analytics (e.g. efficiency.ts).
 */
export async function readWorkspaceMemberDailyMs(
  appId: string,
  workspaceId: string,
  uid: string
): Promise<Record<string, number>> {
  const snap = await workspaceMemberWorkTimeRef(appId, workspaceId, uid).get();
  return (snap.data()?.['dailyMs'] ?? {}) as Record<string, number>;
}

/** Persist merged dailyMs to the user-space path. */
export async function saveUserDailyMs(
  uid: string,
  appId: string,
  merged: Record<string, number>,
  extra?: Record<string, unknown>
): Promise<void> {
  await userWorkTimeRef(uid, appId).set(
    {
      uid,
      appId,
      dailyMs: merged,
      updatedAt: new Date().toISOString(),
      ...extra
    },
    { merge: true }
  );
}

/** Persist merged dailyMs to the workspace-scoped member path. */
export async function saveWorkspaceMemberDailyMs(
  appId: string,
  workspaceId: string,
  uid: string,
  merged: Record<string, number>
): Promise<void> {
  await workspaceMemberWorkTimeRef(appId, workspaceId, uid).set(
    {
      memberUid: uid,
      appId,
      workspaceId,
      dailyMs: merged,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

// ─── HTTP handler (POST only — data is read via app-specific functions) ───────

export const sync = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'worktime-sync-post');
    if (uid === undefined) return;

    const body = req.body as {
      appId?: unknown;
      dailyMs?: unknown;
      workspaceId?: unknown;
    };

    const appId = typeof body.appId === 'string' ? body.appId.trim() : '';
    if (!appId || !ALLOWED_APP_IDS.has(appId)) {
      res.status(400).json({ error: 'Valid appId is required' });
      return;
    }

    if (
      !body.dailyMs ||
      typeof body.dailyMs !== 'object' ||
      Array.isArray(body.dailyMs)
    ) {
      res
        .status(400)
        .json({ error: 'dailyMs must be a Record<string, number>' });
      return;
    }

    const sanitised = sanitiseDailyMs(body.dailyMs as Record<string, unknown>);

    if (Object.keys(sanitised).length === 0) {
      res.status(400).json({ error: 'No valid dailyMs entries provided' });
      return;
    }

    const existing = await readUserDailyMs(uid, appId);
    const merged = mergeDailyMs(existing, sanitised);

    const workspaceId =
      typeof body.workspaceId === 'string'
        ? body.workspaceId.trim()
        : undefined;

    // Dual-write: user-space (personal history) + workspace-space (team analytics)
    const writes: Promise<void>[] = [saveUserDailyMs(uid, appId, merged)];

    if (workspaceId) {
      const existingWs = await readWorkspaceMemberDailyMs(
        appId,
        workspaceId,
        uid
      );
      const mergedWs = mergeDailyMs(existingWs, sanitised);
      writes.push(
        saveWorkspaceMemberDailyMs(appId, workspaceId, uid, mergedWs)
      );
    }

    await Promise.all(writes);

    void recordBackendUsage(appId as APPID, uid, `${appId}.worktime.sync`, {
      firestoreReads: workspaceId ? 2 : 1,
      firestoreUpdates: workspaceId ? 2 : 1,
      entityBreakdown: {
        worktime: { reads: workspaceId ? 2 : 1, updates: workspaceId ? 2 : 1 }
      }
    });

    logger.info('worktime-sync success', {
      uid,
      appId,
      dayCount: Object.keys(sanitised).length
    });

    res.json({ ok: true, syncedDays: Object.keys(sanitised).length });
  }
);
