import { admin } from '../global';

export interface DecodedUser {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
}

/**
 * Validates a Google OAuth access_token via the tokeninfo endpoint and
 * returns the corresponding Firebase Auth UID.
 */
export async function getUidFromAccessToken(
  accessToken: string
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) throw new Error(`tokeninfo returned ${res.status}`);
  const info = (await res.json()) as { email?: string; error?: string };
  if (!info.email || info.error)
    throw new Error('Invalid access token: missing email');
  const user = await admin.auth().getUserByEmail(info.email);
  return user.uid;
}

/**
 * Like resolveUid but also returns profile fields from the token/user record,
 * avoiding a redundant admin.auth().getUser() call in callers.
 */
export async function resolveDecodedUser(
  bearerToken: string
): Promise<DecodedUser> {
  const isJwt = bearerToken.split('.').length === 3;
  if (isJwt) {
    const decoded = await admin.auth().verifyIdToken(bearerToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name as string | undefined,
      phoneNumber: decoded.phone_number as string | undefined,
      photoURL: decoded.picture as string | undefined
    };
  }
  // OAuth access token path — must look up the user record
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(bearerToken)}`
  );
  if (!res.ok) throw new Error(`tokeninfo returned ${res.status}`);
  const info = (await res.json()) as { email?: string; error?: string };
  if (!info.email || info.error)
    throw new Error('Invalid access token: missing email');
  const user = await admin.auth().getUserByEmail(info.email);
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL
  };
}

/**
 * Accepts a Firebase ID token (Flutter/web) or a Google OAuth token
 * (VS Code extension). Tries Firebase ID token first; falls back to OAuth
 * only for non-JWT tokens (e.g. Google OAuth access tokens like 'ya29.*').
 */
export async function resolveUid(bearerToken: string): Promise<string> {
  // JWT tokens have 3 dot-separated base64url segments.
  const isJwt = bearerToken.split('.').length === 3;
  if (isJwt) {
    // Always use verifyIdToken for JWTs — propagate the real error on failure
    // instead of silently falling through to OAuth (which fails for phone users).
    const decoded = await admin.auth().verifyIdToken(bearerToken);
    return decoded.uid;
  }
  // Non-JWT: assume Google OAuth access token (CLI flow).
  return getUidFromAccessToken(bearerToken);
}
