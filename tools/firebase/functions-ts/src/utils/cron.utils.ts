/**
 * Generic cron-job batch helpers backed by Firebase Realtime Database.
 *
 * These operate on the `/cron-jobs`, `/cron-by-function`, and `/cron-by-taskId`
 * RTDB paths and are not specific to any single app.
 *
 * Exported here so that shared infrastructure (e.g. billing gateways) can use
 * them without importing from inside `src/apps/`.
 *
 * `src/apps/offerings/cron-functions.ts` re-exports these for backward compat.
 */

import { rtdb } from '../global';

/** String constant for the Paytm status-check cron function name. */
export const PAYTM_STATUS_CHECK_CRON = 'PAYTM_STATUS_CHECK_CRON';

/**
 * Atomically writes a new cron-job entry to all relevant RTDB paths.
 * `data` must contain at least a `function` key (the cron type string).
 */
export function writeCronBatch(data: Record<string, any>): Promise<void> {
  const cronData: Record<string, any> = {};
  const rootRef = rtdb.ref();
  const key = rootRef.push().key;
  cronData['/cron-jobs/' + key] = data;
  cronData['/cron-by-function/' + data['function'] + '/' + key] = data;
  if (data.taskId) {
    cronData['/cron-by-taskId/' + data.taskId + '/' + key] = data;
  }
  return rootRef.update(cronData);
}

/**
 * Atomically removes a cron-job snapshot from all relevant RTDB paths.
 */
export function deleteCronBatch(snapshot: any): Promise<void> {
  if (snapshot.exists()) {
    const cronData: Record<string, any> = {};
    const data = snapshot.val();
    const rootRef = rtdb.ref();
    const key = snapshot.key;
    cronData['/cron-jobs/' + key] = null;
    cronData['/cron-by-function/' + data.function + '/' + key] = null;
    if (data.taskId) {
      cronData['/cron-by-taskId/' + data.taskId + '/' + key] = null;
    }
    return rootRef.update(cronData);
  }
  return Promise.resolve();
}

/**
 * Atomically applies `updateObj` fields to an existing cron-job snapshot across
 * all relevant RTDB paths.
 */
export function updateCronBatch(
  snapshot: any,
  updateObj: Record<string, any>
): Promise<void> {
  if (snapshot != null) {
    const cronData: Record<string, any> = {};
    const data = snapshot.val();
    const rootRef = rtdb.ref();
    const key = snapshot.key;
    for (const keyToUpdate in updateObj) {
      cronData['/cron-jobs/' + key + '/' + keyToUpdate] =
        updateObj[keyToUpdate];
      cronData[
        '/cron-by-function/' + data.function + '/' + key + '/' + keyToUpdate
      ] = updateObj[keyToUpdate];
      if (data.taskId) {
        cronData[
          '/cron-by-taskId/' + data.taskId + '/' + key + '/' + keyToUpdate
        ] = updateObj[keyToUpdate];
      }
    }
    return rootRef.update(cronData);
  }
  return Promise.resolve();
}
