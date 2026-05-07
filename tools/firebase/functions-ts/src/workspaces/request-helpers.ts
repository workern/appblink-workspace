import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import { resolveUid, resolveDecodedUser, type DecodedUser } from './auth';

export type { DecodedUser };

/**
 * Extracts the Bearer token, resolves the UID, and returns it.
 * Accepts an optional custom resolver (e.g. `getUidFromAccessToken` for
 * extension-only endpoints that skip the JWT path for performance).
 * Writes a 401 response and returns undefined if auth fails.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  logTag: string,
  resolver: (token: string) => Promise<string> = resolveUid
): Promise<string | undefined> {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return undefined;
  }
  try {
    return await resolver(h.slice(7));
  } catch (err) {
    logger.warn(`${logTag}: auth failed`, err);
    res.status(401).json({ error: 'Authentication failed' });
    return undefined;
  }
}

/**
 * Like requireAuth but returns the full decoded user profile (email, displayName,
 * phoneNumber, photoURL) so callers don't need a redundant admin.auth().getUser() call.
 */
export async function requireAuthDecoded(
  req: Request,
  res: Response,
  logTag: string
): Promise<DecodedUser | undefined> {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return undefined;
  }
  try {
    return await resolveDecodedUser(h.slice(7));
  } catch (err) {
    logger.warn(`${logTag}: auth failed`, err);
    res.status(401).json({ error: 'Authentication failed' });
    return undefined;
  }
}

/**
 * Checks that req.method matches one of the allowed methods.
 * Writes a 405 response and returns false on mismatch.
 */
export function requireMethod(
  req: Request,
  res: Response,
  ...methods: string[]
): boolean {
  if (!methods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

/**
 * Validates the request body against a Zod schema.
 * Writes a 400 response and returns undefined if validation fails.
 */
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
  res: Response,
  errorPrefix: string
): T | undefined {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: `${errorPrefix}: ${parsed.error.message}` });
    return undefined;
  }
  return parsed.data;
}
