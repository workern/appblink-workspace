export type FirebaseUsageEntityOp = 'reads' | 'creates' | 'updates' | 'deletes';

export interface FirebaseUsageEntityOps {
  reads?: number;
  creates?: number;
  updates?: number;
  deletes?: number;
}

export type FirebaseUsageEntityBreakdown = Record<
  string,
  FirebaseUsageEntityOps
>;

export function normalizeFirebaseUsageEntity(
  entity?: string
): string | undefined {
  if (!entity) return undefined;
  const normalized = entity
    .replace(/[./#$\[\]]/g, '_')
    .trim()
    .toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

export function bumpFirebaseUsageEntityOp(
  breakdown: FirebaseUsageEntityBreakdown,
  entity: string | undefined,
  op: FirebaseUsageEntityOp,
  count: number
): void {
  if (count <= 0) return;
  const normalized = normalizeFirebaseUsageEntity(entity);
  if (!normalized) return;

  const existing = breakdown[normalized] ?? {};
  existing[op] = (existing[op] ?? 0) + count;
  breakdown[normalized] = existing;
}

export function cloneFirebaseUsageEntityBreakdown(
  breakdown: FirebaseUsageEntityBreakdown
): FirebaseUsageEntityBreakdown {
  return Object.fromEntries(
    Object.entries(breakdown).map(([entity, ops]) => [entity, { ...ops }])
  );
}

export function mergeFirebaseUsageEntityBreakdown(
  target: FirebaseUsageEntityBreakdown,
  source: FirebaseUsageEntityBreakdown
): void {
  for (const [entity, ops] of Object.entries(source)) {
    if (ops.reads)
      bumpFirebaseUsageEntityOp(target, entity, 'reads', ops.reads);
    if (ops.creates)
      bumpFirebaseUsageEntityOp(target, entity, 'creates', ops.creates);
    if (ops.updates)
      bumpFirebaseUsageEntityOp(target, entity, 'updates', ops.updates);
    if (ops.deletes)
      bumpFirebaseUsageEntityOp(target, entity, 'deletes', ops.deletes);
  }
}

export function hasFirebaseUsageEntityBreakdown(
  breakdown: FirebaseUsageEntityBreakdown
): boolean {
  return Object.keys(breakdown).length > 0;
}
