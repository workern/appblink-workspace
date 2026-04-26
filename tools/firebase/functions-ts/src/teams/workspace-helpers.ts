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
