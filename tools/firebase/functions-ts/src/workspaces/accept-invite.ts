import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import { admin, db, deployOptions } from '../global';
import {
  toWorkspaceDocId,
  memberRef,
  membershipIndexRef,
  pendingInviteRef
} from './helpers';

function deriveCapabilities(
  role: 'owner' | 'admin' | 'member',
  functionalRoles: string[]
): string[] {
  const capabilities = new Set<string>();
  if (role === 'owner') {
    capabilities.add('manage_workspace');
    capabilities.add('manage_members');
    capabilities.add('manage_billing');
    capabilities.add('manage_workspace_content');
  } else if (role === 'admin') {
    capabilities.add('manage_members');
    capabilities.add('manage_workspace_content');
  }
  for (const functionalRole of functionalRoles) {
    if (functionalRole === 'developer') {
      capabilities.add('manage_tasks');
      capabilities.add('manage_vibechecks');
      capabilities.add('apply_repo_changes');
    } else if (functionalRole === 'designer') {
      capabilities.add('upload_assets');
      capabilities.add('manage_branding_assets');
    } else if (functionalRole === 'marketing') {
      capabilities.add('edit_store_listing');
      capabilities.add('manage_paywall_links');
      capabilities.add('manage_release_metadata');
    } else if (functionalRole === 'qa') {
      capabilities.add('manage_vibechecks');
    } else if (functionalRole === 'content') {
      capabilities.add('edit_store_listing');
      capabilities.add('publish_content');
    } else if (functionalRole === 'publisher') {
      capabilities.add('manage_release_metadata');
      capabilities.add('publish_content');
    }
  }
  return Array.from(capabilities).sort();
}

const acceptInviteSchema = z.object({
  inviteId: z.string().min(1),
  appId: z.string().min(1)
});

// ─── Auth trigger helper (called from auth.ts onCreate) ───────────────────────

/**
 * When a new user signs up, check if they have any pending workspace invites
 * and auto-accept them all.  Call this from the auth.ts `writeNewUserToFirestore`
 * onCreate trigger.
 *
 * Accepts both the user's email and uid so the invite docs can be located and
 * the member doc + membership index can be written atomically.
 */
export async function acceptPendingInvitesForUser(
  uid: string,
  email: string,
  displayName: string | null,
  photoUrl: string | null,
  phoneNumber: string | null
): Promise<void> {
  const pendingByEmailPromise = email
    ? db
        .collectionGroup('invites')
        .where('invitedEmail', '==', email)
        .where('status', '==', 'pending')
        .get()
    : Promise.resolve(null);

  const pendingByPhonePromise = phoneNumber
    ? db
        .collectionGroup('invites')
        .where('invitedPhoneNumber', '==', phoneNumber)
        .where('status', '==', 'pending')
        .get()
    : Promise.resolve(null);

  const [pendingByEmail, pendingByPhone] = await Promise.all([
    pendingByEmailPromise,
    pendingByPhonePromise
  ]);

  const pendingDocs = new Map<
    string,
    FirebaseFirestore.QueryDocumentSnapshot
  >();
  for (const snap of [pendingByEmail, pendingByPhone]) {
    if (!snap) continue;
    for (const doc of snap.docs) {
      pendingDocs.set(doc.id, doc);
    }
  }

  if (pendingDocs.size === 0) return;

  logger.info(
    `[teams] acceptPendingInvites: ${pendingDocs.size} invite(s) for uid=${uid}`
  );

  const now = new Date().toISOString();
  const batch = db.batch();

  for (const inviteDoc of pendingDocs.values()) {
    const invite = inviteDoc.data() as {
      appId: string;
      workspaceId: string;
      workspaceDocId: string;
      workspaceName: string;
      role: 'owner' | 'admin' | 'member';
      functionalRoles?: string[];
      capabilities?: string[];
      spaces: string[] | null;
    };

    const {
      appId,
      workspaceId,
      workspaceDocId,
      workspaceName,
      role,
      functionalRoles = [],
      capabilities = deriveCapabilities(role, functionalRoles),
      spaces
    } = invite;

    // Write member doc
    batch.set(memberRef(appId, workspaceId, uid), {
      uid,
      email,
      displayName: displayName ?? null,
      photoUrl: photoUrl ?? null,
      ...(phoneNumber ? { phoneNumber } : {}),
      role,
      functionalRoles,
      capabilities,
      spaces,
      joinedAt: now
    });

    // Write membership index so the app can discover this workspace
    batch.set(membershipIndexRef(appId, uid, workspaceId), {
      workspaceId,
      workspaceDocId,
      name: workspaceName,
      appId,
      role,
      functionalRoles,
      capabilities,
      spaces,
      updatedAt: now
    });

    // Mark invite as accepted
    batch.update(inviteDoc.ref, { status: 'accepted', updatedAt: now });

    // Write an in-app welcome notification
    const notifRef = db
      .collection('users')
      .doc(uid)
      .collection('notifications')
      .doc();
    batch.set(notifRef, {
      id: notifRef.id,
      type: 'WORKSPACE_INVITE',
      title: `Welcome to ${workspaceName}!`,
      description: `You now have access to the ${workspaceName} workspace in ${appId}.`,
      data: { workspaceId, appId },
      seen: false,
      createdAt: now,
      updatedAt: now
    });
  }

  await batch.commit();
  logger.info(`[teams] acceptPendingInvites: done for uid=${uid}`);
}

// ─── HTTP: manually accept a specific invite (optional / for UI flows) ────────

/**
 * Accept a specific workspace invite by ID.
 * Useful if you build a UI where users can see their pending invites.
 *
 * POST body: { inviteId, appId }
 * Auth: Firebase ID token
 */
export const acceptinvite = onRequest(
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

    let uid: string;
    let email: string;
    let displayName: string | null;
    let photoUrl: string | null;
    let phoneNumber: string | null;
    try {
      const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
      email = decoded.email ?? '';
      displayName = decoded.name ?? null;
      photoUrl = decoded.picture ?? null;
      phoneNumber = decoded.phone_number ?? null;
    } catch (err) {
      logger.warn('workspaces-acceptinvite: auth failed', err);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'User must have an email address' });
      return;
    }

    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: `Invalid request: ${parsed.error.message}` });
      return;
    }

    const { inviteId, appId } = parsed.data;

    const inviteRef = pendingInviteRef(appId).doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    const invite = inviteSnap.data() as {
      invitedEmail: string;
      invitedPhoneNumber?: string;
      status: string;
      workspaceId: string;
      workspaceDocId: string;
      workspaceName: string;
      role: 'owner' | 'admin' | 'member';
      functionalRoles?: string[];
      capabilities?: string[];
      spaces: string[] | null;
    };

    const emailMatches = invite.invitedEmail === email;
    const phoneMatches =
      !!invite.invitedPhoneNumber &&
      !!phoneNumber &&
      invite.invitedPhoneNumber === phoneNumber;

    if (!emailMatches && !phoneMatches) {
      res
        .status(403)
        .json({ error: 'This invite was sent to a different email/phone' });
      return;
    }

    if (invite.status !== 'pending') {
      res.status(400).json({ error: `Invite is already ${invite.status}` });
      return;
    }

    const {
      workspaceId,
      workspaceDocId,
      workspaceName,
      role,
      functionalRoles = [],
      capabilities = deriveCapabilities(role, functionalRoles),
      spaces
    } = invite;
    const now = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      tx.set(memberRef(appId, workspaceId, uid), {
        uid,
        email,
        displayName,
        photoUrl,
        role,
        functionalRoles,
        capabilities,
        spaces,
        joinedAt: now
      });
      tx.set(membershipIndexRef(appId, uid, workspaceId), {
        workspaceId,
        workspaceDocId,
        name: workspaceName,
        appId,
        role,
        functionalRoles,
        capabilities,
        spaces,
        updatedAt: now
      });
      tx.update(inviteRef, { status: 'accepted', updatedAt: now });
    });

    logger.info('workspaces-acceptinvite: accepted', { uid, workspaceId, appId });
    res.json({ status: 'accepted', workspaceId });
  }
);
