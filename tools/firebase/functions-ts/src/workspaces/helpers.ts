import { WriteBatch } from 'firebase-admin/firestore';
import { db } from '../global';

/**
 * Sanitises a workspaceId (e.g. "kartik/my-repo") into a valid Firestore
 * document ID by replacing forward-slashes with double-dashes.
 * Must stay in sync with client-side toWorkspaceDocId() helpers.
 */
export function toWorkspaceDocId(workspaceId: string): string {
  return workspaceId.replace(/\//g, '--');
}

export function workspaceRef(appId: string, workspaceId: string) {
  return db
    .collection('apps')
    .doc(appId)
    .collection('workspaces')
    .doc(toWorkspaceDocId(workspaceId));
}

export function memberRef(appId: string, workspaceId: string, uid: string) {
  return workspaceRef(appId, workspaceId).collection('members').doc(uid);
}

/**
 * Per-user membership index so Flutter/Angular can discover all workspaces
 * the user belongs to, across any app.
 * Path: users/{uid}/mySpaces/{appId}/memberships/{workspaceDocId}
 */
export function membershipIndexRef(
  appId: string,
  uid: string,
  workspaceId: string
) {
  return db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc(appId)
    .collection('memberships')
    .doc(toWorkspaceDocId(workspaceId));
}

/** Pending invite doc for users who don't have a Firebase account yet. */
export function pendingInviteRef(appId: string) {
  return db.collection('apps').doc(appId).collection('invites');
}

/**
 * Adds the three workspace-owner documents to an existing Firestore WriteBatch.
 * Call this when creating a new resource that owns its own workspace
 * (e.g. an NSM shop, a PromptKul project).
 *
 * Written paths (idempotent — uses merge:true):
 *   apps/{appId}/workspaces/{workspaceId}                       ← workspace doc
 *   apps/{appId}/workspaces/{workspaceId}/members/{owner.uid}   ← owner member
 *   users/{owner.uid}/mySpaces/{appId}/memberships/{workspaceId}← personal index
 */
export function addWorkspaceOwnerToBatch(
  batch: WriteBatch,
  appId: string,
  workspaceId: string,
  owner: {
    uid: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
  },
  workspaceName: string
): void {
  const now = new Date().toISOString();
  const ownerCapabilities = [
    'manage_workspace',
    'manage_members',
    'manage_billing',
    'manage_workspace_content'
  ];

  batch.set(
    workspaceRef(appId, workspaceId),
    {
      workspaceId,
      name: workspaceName,
      ownerId: owner.uid,
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );

  batch.set(
    memberRef(appId, workspaceId, owner.uid),
    {
      uid: owner.uid,
      role: 'owner',
      functionalRoles: [],
      capabilities: ownerCapabilities,
      spaces: null,
      joinedAt: now,
      ...(owner.email ? { email: owner.email } : {}),
      ...(owner.displayName ? { displayName: owner.displayName } : {}),
      ...(owner.photoUrl ? { photoUrl: owner.photoUrl } : {})
    },
    { merge: true }
  );

  batch.set(
    membershipIndexRef(appId, owner.uid, workspaceId),
    {
      workspaceId,
      name: workspaceName,
      role: 'owner',
      functionalRoles: [],
      capabilities: ownerCapabilities,
      spaces: null,
      updatedAt: now
    },
    { merge: true }
  );
}
