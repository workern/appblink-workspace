import { HttpsError } from 'firebase-functions/v2/https';
import { admin, db } from '../global';
import { APPID } from '@workern/models';

export async function getAppClaimsForUser(uid: string, appId: APPID) {
  const userRecord = await db.collection('userClaims').doc(uid).get();
  const claims = (userRecord.data() || {}) as Record<string, any>;
  const appClaims = claims?.[appId];

  if (!appClaims || typeof appClaims !== 'object') {
    return null;
  }

  return appClaims as Record<string, any>;
}

export async function ensureUserHasAppClaim(
  uid: string,
  appId: APPID,
  key?: string
) {
  const appClaims = await getAppClaimsForUser(uid, appId);
  if (!appClaims) {
    throw new HttpsError(
      'permission-denied',
      `User does not have claims for app ${appId}`
    );
  }

  if (!key) {
    return appClaims;
  }

  const entitlements =
    appClaims.entitlements && typeof appClaims.entitlements === 'object'
      ? (appClaims.entitlements as Record<string, any>)
      : {};

  if (!entitlements[key]) {
    throw new HttpsError(
      'permission-denied',
      `User does not have required entitlement ${key} for app ${appId}`
    );
  }

  return appClaims;
}

export async function hasActiveSubscriptionForApp(uid: string, appId: APPID) {
  const appClaims = await getAppClaimsForUser(uid, appId);
  if (!appClaims) {
    return false;
  }

  const entitlements =
    appClaims.entitlements && typeof appClaims.entitlements === 'object'
      ? (appClaims.entitlements as Record<string, any>)
      : {};

  return Object.keys(entitlements).length > 0;
}

export async function revokeAppClaimsForUser(uid: string, appId: APPID) {
  const ref = db.collection('userClaims').doc(uid);
  await ref.update({
    [appId]: admin.firestore.FieldValue.delete()
  });
}
