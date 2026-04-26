import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import { admin, db, deployOptions } from '../global';
import {
  toWorkspaceDocId,
  workspaceRef,
  memberRef,
  membershipIndexRef,
  pendingInviteRef
} from './workspace-helpers';

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Only accepts Firebase ID tokens (Flutter / Angular web clients). */
async function resolveUid(bearerToken: string): Promise<string> {
  const decoded = await admin.auth().verifyIdToken(bearerToken);
  return decoded.uid;
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Writes a doc to the `mail` collection — the Firestore Send Email extension
 * watches this collection and dispatches the SMTP email automatically.
 */
async function sendInviteEmail(opts: {
  toEmail: string;
  invitedByName: string;
  invitedByEmail: string;
  workspaceName: string;
  appId: string;
}): Promise<void> {
  await db.collection('mail').add({
    to: [opts.toEmail],
    template: {
      name: 'workspaceInvite',
      data: {
        senderName: opts.invitedByName,
        senderEmail: opts.invitedByEmail,
        workspaceName: opts.workspaceName,
        appId: opts.appId
      }
    }
  });
}

/**
 * Writes an in-app notification for users who already have a Firebase account.
 * The app streams `users/{uid}/notifications` in real time.
 */
async function sendInviteNotification(opts: {
  targetUid: string;
  invitedByName: string;
  workspaceName: string;
  appId: string;
  workspaceId: string;
}): Promise<void> {
  const notifRef = db
    .collection('users')
    .doc(opts.targetUid)
    .collection('notifications')
    .doc();
  const now = new Date().toISOString();
  await notifRef.set({
    id: notifRef.id,
    type: 'WORKSPACE_INVITE',
    title: `${opts.invitedByName} invited you to ${opts.workspaceName}`,
    description: `You now have access to the ${opts.workspaceName} workspace in ${opts.appId}.`,
    data: { workspaceId: opts.workspaceId, appId: opts.appId },
    seen: false,
    createdAt: now,
    updatedAt: now
  });
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const inviteMemberSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['owner', 'member']).default('member'),
  /** null = access to all spaces; string[] = restrict to listed spaces */
  spaces: z.array(z.string()).nullable().default(null)
});

const removeMemberSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  targetUid: z.string().min(1)
});

// ─── HTTP Functions ───────────────────────────────────────────────────────────

/**
 * Invite a user by email to any app workspace.
 * Caller must be a workspace owner.
 *
 * POST body: { appId, workspaceId, email, role?, spaces? }
 *
 * Outcomes:
 *  - User exists in Firebase Auth → member doc + membership index written immediately.
 *    Returns { status: 'added', uid }
 *  - User has no account yet → pending invite doc written.
 *    Returns { status: 'pending', inviteId }
 *  - User already a member → Returns { status: 'already_member', uid }
 */
export const invitemember = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res
        .status(401)
        .json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    let callerUid: string;
    try {
      callerUid = await resolveUid(authHeader.slice(7));
    } catch (err) {
      logger.warn('teams-invitemember: auth failed', err);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: `Invalid request: ${parsed.error.message}` });
      return;
    }

    const { appId, workspaceId, email, role, spaces } = parsed.data;
    const workspaceDocId = toWorkspaceDocId(workspaceId);
    const now = new Date().toISOString();

    // Verify caller is an owner of this workspace
    const callerMemberSnap = await memberRef(
      appId,
      workspaceId,
      callerUid
    ).get();
    if (
      !callerMemberSnap.exists ||
      callerMemberSnap.data()?.['role'] !== 'owner'
    ) {
      res
        .status(403)
        .json({ error: 'Only workspace owners can invite members' });
      return;
    }

    // Load workspace metadata for the invite/membership doc
    const wsSnap = await workspaceRef(appId, workspaceId).get();
    if (!wsSnap.exists) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    const workspaceName =
      (wsSnap.data()?.['name'] as string | undefined) ?? workspaceId;

    // Attempt to look up the invitee by email in Firebase Auth
    try {
      const inviteeUser = await admin.auth().getUserByEmail(email);
      const inviteeUid = inviteeUser.uid;

      // Idempotent: already a member
      const existingMember = await memberRef(
        appId,
        workspaceId,
        inviteeUid
      ).get();
      if (existingMember.exists) {
        res.json({ status: 'already_member', uid: inviteeUid });
        return;
      }

      // Atomically add member doc + membership index
      await db.runTransaction(async (tx) => {
        tx.set(memberRef(appId, workspaceId, inviteeUid), {
          uid: inviteeUid,
          email: inviteeUser.email ?? email,
          displayName: inviteeUser.displayName ?? null,
          photoUrl: inviteeUser.photoURL ?? null,
          role,
          spaces,
          joinedAt: now
        });
        tx.set(membershipIndexRef(appId, inviteeUid, workspaceId), {
          workspaceId,
          workspaceDocId,
          name: workspaceName,
          appId,
          role,
          updatedAt: now
        });
      });

      // Read caller display name for the notification / email
      const callerRecord = await admin.auth().getUser(callerUid);
      const callerName =
        callerRecord.displayName ?? callerRecord.email ?? callerUid;

      // Fire email + in-app notification in parallel (non-blocking to the TX)
      await Promise.all([
        sendInviteEmail({
          toEmail: email,
          invitedByName: callerName,
          invitedByEmail: callerRecord.email ?? '',
          workspaceName,
          appId
        }),
        sendInviteNotification({
          targetUid: inviteeUid,
          invitedByName: callerName,
          workspaceName,
          appId,
          workspaceId
        })
      ]);

      logger.info('teams-invitemember: member added', {
        appId,
        workspaceId,
        inviteeUid
      });
      res.json({ status: 'added', uid: inviteeUid });
    } catch (err: unknown) {
      const isNotFound =
        err instanceof Error &&
        (err.message.includes('There is no user record') ||
          (err as { code?: string }).code === 'auth/user-not-found');

      if (isNotFound) {
        // No Firebase account yet — store a pending invite
        const inviteDocRef = pendingInviteRef(appId).doc();
        await inviteDocRef.set({
          id: inviteDocRef.id,
          appId,
          workspaceId,
          workspaceDocId,
          workspaceName,
          invitedEmail: email,
          invitedByUid: callerUid,
          role,
          spaces,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        });

        // Still send the email — the link can point to the app's sign-up page
        const callerRecord = await admin.auth().getUser(callerUid);
        const callerName =
          callerRecord.displayName ?? callerRecord.email ?? callerUid;
        await sendInviteEmail({
          toEmail: email,
          invitedByName: callerName,
          invitedByEmail: callerRecord.email ?? '',
          workspaceName,
          appId
        });

        logger.info('teams-invitemember: pending invite created', {
          appId,
          workspaceId,
          email
        });
        res.json({ status: 'pending', inviteId: inviteDocRef.id });
      } else {
        logger.error('teams-invitemember: unexpected error', err);
        res.status(500).json({ error: 'Failed to invite member' });
      }
    }
  }
);

/**
 * Remove a member from a workspace.
 * Caller must be an owner OR removing themselves (leave workspace).
 * The last owner of a workspace cannot be removed.
 *
 * POST body: { appId, workspaceId, targetUid }
 */
export const removemember = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res
        .status(401)
        .json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    let callerUid: string;
    try {
      callerUid = await resolveUid(authHeader.slice(7));
    } catch (err) {
      logger.warn('teams-removemember: auth failed', err);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const parsed = removeMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: `Invalid request: ${parsed.error.message}` });
      return;
    }

    const { appId, workspaceId, targetUid } = parsed.data;

    const callerMemberSnap = await memberRef(
      appId,
      workspaceId,
      callerUid
    ).get();
    const isSelf = callerUid === targetUid;
    const isOwner =
      callerMemberSnap.exists && callerMemberSnap.data()?.['role'] === 'owner';

    if (!isOwner && !isSelf) {
      res.status(403).json({ error: 'Only owners can remove other members' });
      return;
    }

    // Prevent orphaning the workspace by removing its last owner
    if (isSelf && isOwner) {
      const ownersSnap = await workspaceRef(appId, workspaceId)
        .collection('members')
        .where('role', '==', 'owner')
        .get();
      if (ownersSnap.size <= 1) {
        res.status(400).json({
          error: 'Cannot remove the last owner. Transfer ownership first.'
        });
        return;
      }
    }

    await db.runTransaction(async (tx) => {
      tx.delete(memberRef(appId, workspaceId, targetUid));
      tx.delete(membershipIndexRef(appId, targetUid, workspaceId));
    });

    logger.info('teams-removemember: member removed', {
      appId,
      workspaceId,
      targetUid
    });
    res.json({ status: 'removed', uid: targetUid });
  }
);

/**
 * List all members of a workspace.
 * Caller must be a workspace member.
 *
 * GET ?appId=&workspaceId=
 */
export const listmembers = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res
        .status(401)
        .json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    let callerUid: string;
    try {
      callerUid = await resolveUid(authHeader.slice(7));
    } catch (err) {
      logger.warn('teams-listmembers: auth failed', err);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    const appId = req.query['appId'] as string | undefined;
    const workspaceId = req.query['workspaceId'] as string | undefined;

    if (!appId || !workspaceId) {
      res
        .status(400)
        .json({ error: 'appId and workspaceId query params are required' });
      return;
    }

    // Verify caller is a member before returning any data
    const callerMemberSnap = await memberRef(
      appId,
      workspaceId,
      callerUid
    ).get();
    if (!callerMemberSnap.exists) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const membersSnap = await workspaceRef(appId, workspaceId)
      .collection('members')
      .get();

    const members = membersSnap.docs.map((d) => d.data());
    res.json({ members });
  }
);
