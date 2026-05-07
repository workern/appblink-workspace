/**
 * Returns the best human-readable label for a workspace member or task actor.
 * Priority: displayName → email → mobile/phoneNumber → uid → fallback
 */
export function memberLabel(
  person:
    | {
        displayName?: string | null;
        email?: string | null;
        mobile?: string | null;
        uid?: string | null;
      }
    | null
    | undefined,
  fallback = '—'
): string {
  if (!person) return fallback;
  return (
    (typeof person.displayName === 'string' ? person.displayName.trim() : '') ||
    person.email ||
    person.mobile ||
    person.uid ||
    fallback
  );
}
