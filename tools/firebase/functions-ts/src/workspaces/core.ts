/**
 * workspaces.ts
 * Top-level workspace management functions, reusable across all apps.
 * Exported as `workspaces-*` Cloud Function names.
 *
 * Every function accepts an `appId` field (body or query param) so any
 * app with a team/workspace concept can reuse these without duplicating logic.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import { admin, db, deployOptions } from '../global';
import type { Response } from 'express';
import {
  requireAuth,
  requireAuthDecoded,
  requireMethod,
  parseBody
} from './request-helpers';

// ─── Generic Path Helpers ─────────────────────────────────────────────────────

/** Sanitises a workspaceId (e.g. "owner/my-repo") into a valid Firestore doc ID. */
export function toWorkspaceDocId(workspaceId: string): string {
  return workspaceId.replace(/\//g, '--');
}

/** Firestore ref to the workspace document for any app. */
export function workspaceRefForApp(appId: string, workspaceId: string) {
  return db
    .collection('apps')
    .doc(appId)
    .collection('workspaces')
    .doc(toWorkspaceDocId(workspaceId));
}

/** Per-user membership index ref for any app. */
export function membershipIndexRefForApp(
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

/**
 * Verifies the caller is a member of the given workspace for any app.
 * Writes a 403 response and returns false if not a member.
 */
export async function requireWorkspaceMemberForApp(
  appId: string,
  workspaceId: string,
  uid: string,
  res: Response
): Promise<boolean> {
  const snap = await workspaceRefForApp(appId, workspaceId)
    .collection('members')
    .doc(uid)
    .get();
  if (!snap.exists) {
    res.status(403).json({ error: 'Not a member of this workspace' });
    return false;
  }
  return true;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ensureWorkspaceSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().optional()
});

const functionalRoleSchema = z.enum([
  'developer',
  'designer',
  'marketing',
  'qa',
  'content',
  'publisher'
]);

const functionalRolesSchema = z.array(functionalRoleSchema).default([]);

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

const listWorkspaceMembersSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1)
});

const inviteMemberSchema = z
  .object({
    appId: z.string().min(1),
    workspaceId: z.string().min(1),
    email: z.string().email().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/)
      .optional(),
    role: z.enum(['owner', 'admin', 'member']).default('member'),
    functionalRoles: functionalRolesSchema,
    spaces: z.array(z.string()).nullable().default(null)
  })
  .refine(
    (d) => {
      const hasEmail = Boolean(d.email?.trim());
      const hasPhone = Boolean(d.phoneNumber?.trim());
      return (hasEmail || hasPhone) && !(hasEmail && hasPhone);
    },
    {
      message: 'Provide exactly one invite target: email or phoneNumber'
    }
  );

const removeMemberSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  targetUid: z.string().min(1)
});

const transferOwnershipSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  targetUid: z.string().min(1)
});

const updateMemberSchema = z
  .object({
    appId: z.string().min(1),
    workspaceId: z.string().min(1),
    memberUid: z.string().min(1),
    displayName: z.string().min(1).max(100).nullable().optional(),
    photoUrl: z.string().url().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/)
      .nullable()
      .optional(),
    role: z.enum(['owner', 'admin', 'member']).optional(),
    functionalRoles: functionalRolesSchema.optional(),
    spaces: z.array(z.string()).nullable().optional()
  })
  .refine(
    (d) =>
      d.displayName !== undefined ||
      d.photoUrl !== undefined ||
      d.email !== undefined ||
      d.phoneNumber !== undefined ||
      d.role !== undefined ||
      d.functionalRoles !== undefined ||
      d.spaces !== undefined,
    'At least one editable field must be provided'
  );

const updateProfileSchema = z
  .object({
    appId: z.string().min(1),
    displayName: z.string().trim().max(100).nullable().optional(),
    photoUrl: z.string().url().nullable().optional()
  })
  .refine(
    (d) => d.displayName !== undefined || d.photoUrl !== undefined,
    'At least one of displayName or photoUrl must be provided'
  );

const uploadProfilePhotoSchema = z.object({
  appId: z.string().min(1),
  fileName: z.string().min(1).max(120),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  dataBase64: z.string().min(1)
});

// ─── Notification Helpers ─────────────────────────────────────────────────────

/**
 * Sends an invite email via the Firestore Send Email extension.
 * The extension watches the `mail` collection and dispatches SMTP automatically.
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
 * Writes an in-app notification for a user who already has a Firebase account.
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

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Idempotent: creates the workspace doc + owner member doc + per-user membership
 * index the first time a user opens a workspace in any app.
 *
 * POST body: { appId: string, workspaceId: string, name?: string }
 * Returns:   { workspaceId, name, role }
 */
export const ensureworkspace = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const caller = await requireAuthDecoded(
      req,
      res,
      'workspaces-ensureworkspace'
    );
    if (caller === undefined) return;
    const uid = caller.uid;

    const parsed = parseBody(
      ensureWorkspaceSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, workspaceId, name } = parsed;
    const displayName = name ?? workspaceId.split('/').pop() ?? workspaceId;
    const now = new Date().toISOString();

    logger.info('workspaces-ensureworkspace called', {
      uid,
      appId,
      workspaceId
    });

    const wsRef = workspaceRefForApp(appId, workspaceId);
    const memberRef = wsRef.collection('members').doc(uid);
    const indexRef = membershipIndexRefForApp(appId, uid, workspaceId);

    const userEmail = caller.email;
    const userDisplayName = caller.displayName;
    const userPhoneNumber = caller.phoneNumber;
    const userPhotoUrl = caller.photoURL;

    await db.runTransaction(async (tx) => {
      const wsSnap = await tx.get(wsRef);
      const memberSnap = await tx.get(memberRef);

      if (!wsSnap.exists) {
        tx.set(wsRef, {
          workspaceId,
          name: displayName,
          ownerId: uid,
          createdAt: now,
          updatedAt: now
        });
      }

      if (!memberSnap.exists) {
        const nextRole = wsSnap.exists ? 'member' : 'owner';
        const nextFunctionalRoles: string[] = [];
        tx.set(memberRef, {
          uid,
          role: nextRole,
          functionalRoles: nextFunctionalRoles,
          capabilities: deriveCapabilities(nextRole, nextFunctionalRoles),
          spaces: null,
          joinedAt: now,
          ...(userEmail ? { email: userEmail } : {}),
          ...(userDisplayName ? { displayName: userDisplayName } : {}),
          ...(userPhoneNumber ? { phoneNumber: userPhoneNumber } : {}),
          ...(userPhotoUrl ? { photoUrl: userPhotoUrl } : {})
        });
      } else if (
        userEmail ||
        userDisplayName ||
        userPhoneNumber ||
        userPhotoUrl
      ) {
        tx.update(memberRef, {
          ...(userEmail ? { email: userEmail } : {}),
          ...(userDisplayName ? { displayName: userDisplayName } : {}),
          ...(userPhoneNumber ? { phoneNumber: userPhoneNumber } : {}),
          ...(userPhotoUrl ? { photoUrl: userPhotoUrl } : {})
        });
      }

      tx.set(indexRef, {
        workspaceId,
        workspaceDocId: toWorkspaceDocId(workspaceId),
        name: displayName,
        role: memberSnap.exists
          ? (memberSnap.data()?.['role'] ?? 'member')
          : wsSnap.exists
            ? 'member'
            : 'owner',
        functionalRoles: memberSnap.exists
          ? ((memberSnap.data()?.['functionalRoles'] as string[] | undefined) ??
            [])
          : [],
        capabilities: memberSnap.exists
          ? ((memberSnap.data()?.['capabilities'] as string[] | undefined) ??
            [])
          : deriveCapabilities(wsSnap.exists ? 'member' : 'owner', []),
        spaces: memberSnap.exists
          ? ((memberSnap.data()?.['spaces'] as string[] | null | undefined) ??
            null)
          : null,
        updatedAt: now
      });
    });

    logger.info('workspaces-ensureworkspace success', {
      uid,
      appId,
      workspaceId
    });
    res.json({ workspaceId, name: displayName });
  }
);

/**
 * List all workspaces the calling user is a member of for a given app.
 *
 * GET ?appId=<appId>
 * Returns: { workspaces: Array<{ workspaceId, name, role, ... }> }
 */
export const listworkspaces = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    const uid = await requireAuth(req, res, 'workspaces-listworkspaces');
    if (uid === undefined) return;

    const appId = req.query['appId'] as string | undefined;
    if (!appId) {
      res.status(400).json({ error: 'appId query param is required' });
      return;
    }

    const snaps = await db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc(appId)
      .collection('memberships')
      .get();

    const workspaces = snaps.docs.map((d) => d.data());
    res.json({ workspaces });
  }
);

/**
 * List all members of a workspace for a given app.
 *
 * GET ?appId=<appId>&workspaceId=<workspaceId>
 * Returns: { members: Array<{ uid, role, email?, displayName?, joinedAt? }> }
 */
export const listworkspacemembers = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'GET')) return;

    const uid = await requireAuth(req, res, 'workspaces-listworkspacemembers');
    if (uid === undefined) return;

    const appId = req.query['appId'] as string | undefined;
    const workspaceId = req.query['workspaceId'] as string | undefined;
    if (!appId || !workspaceId) {
      res
        .status(400)
        .json({ error: 'appId and workspaceId query params are required' });
      return;
    }

    if (!(await requireWorkspaceMemberForApp(appId, workspaceId, uid, res)))
      return;

    const membersSnap = await workspaceRefForApp(appId, workspaceId)
      .collection('members')
      .get();
    const members = membersSnap.docs.map((d) => d.data());

    logger.info('workspaces-listworkspacemembers success', {
      uid,
      appId,
      workspaceId,
      count: members.length
    });
    res.json({ members });
  }
);

/**
 * Invite a user by email or phone number to a workspace.
 * Caller must be a workspace owner.
 */
export const invitemember = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-invitemember');
    if (uid === undefined) return;

    const parsed = parseBody(
      inviteMemberSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const {
      appId,
      workspaceId,
      email,
      phoneNumber,
      role,
      functionalRoles,
      spaces
    } = parsed;
    const capabilities = deriveCapabilities(role, functionalRoles);
    const now = new Date().toISOString();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phoneNumber?.trim();
    const inviteTarget = normalizedEmail ?? normalizedPhone;
    const wsRef = workspaceRefForApp(appId, workspaceId);
    const wsSnap = await wsRef.get();
    if (!wsSnap.exists) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const callerMemberSnap = await wsRef.collection('members').doc(uid).get();
    if (callerMemberSnap.data()?.['role'] !== 'owner') {
      res
        .status(403)
        .json({ error: 'Only workspace owners can invite members' });
      return;
    }

    const workspaceName =
      (wsSnap.data()?.['name'] as string | undefined) ?? workspaceId;

    try {
      const user = normalizedEmail
        ? await admin.auth().getUserByEmail(normalizedEmail)
        : await admin.auth().getUserByPhoneNumber(normalizedPhone!);
      const inviteeUid = user.uid;

      const existingMember = await wsRef
        .collection('members')
        .doc(inviteeUid)
        .get();
      if (existingMember.exists) {
        res.json({ status: 'already_member', uid: inviteeUid });
        return;
      }

      await db.runTransaction(async (tx) => {
        tx.set(wsRef.collection('members').doc(inviteeUid), {
          uid: inviteeUid,
          ...(normalizedEmail ? { email: user.email ?? normalizedEmail } : {}),
          ...(user.displayName ? { displayName: user.displayName } : {}),
          ...(user.photoURL ? { photoUrl: user.photoURL } : {}),
          ...((user.phoneNumber ?? normalizedPhone)
            ? { phoneNumber: user.phoneNumber ?? normalizedPhone }
            : {}),
          role,
          functionalRoles,
          capabilities,
          spaces,
          joinedAt: now
        });

        tx.set(membershipIndexRefForApp(appId, inviteeUid, workspaceId), {
          workspaceId,
          workspaceDocId: toWorkspaceDocId(workspaceId),
          name: workspaceName,
          appId,
          role,
          functionalRoles,
          capabilities,
          spaces,
          updatedAt: now
        });
      });

      // Send email + in-app notification (non-blocking)
      const callerRecord = await admin.auth().getUser(uid);
      const callerName = callerRecord.displayName ?? callerRecord.email ?? uid;
      await Promise.all([
        ...(normalizedEmail
          ? [
              sendInviteEmail({
                toEmail: normalizedEmail,
                invitedByName: callerName,
                invitedByEmail: callerRecord.email ?? '',
                workspaceName,
                appId
              })
            ]
          : []),
        sendInviteNotification({
          targetUid: inviteeUid,
          invitedByName: callerName,
          workspaceName,
          appId,
          workspaceId
        })
      ]).catch((err) =>
        logger.warn('workspaces-invitemember: notification failed', err)
      );

      logger.info('workspaces-invitemember added', {
        appId,
        workspaceId,
        inviteeUid,
        invitedBy: uid
      });
      res.json({ status: 'added', uid: inviteeUid });
      return;
    } catch (err: unknown) {
      const isUserNotFound =
        err instanceof Error &&
        (err.message.includes('There is no user record') ||
          (err as { code?: string }).code === 'auth/user-not-found');

      if (!isUserNotFound) {
        logger.error('workspaces-invitemember failed', err);
        res.status(500).json({ error: 'Failed to invite member' });
        return;
      }

      const inviteRef = db
        .collection('apps')
        .doc(appId)
        .collection('invites')
        .doc();
      await inviteRef.set({
        id: inviteRef.id,
        appId,
        workspaceId,
        workspaceDocId: toWorkspaceDocId(workspaceId),
        workspaceName,
        ...(normalizedEmail ? { invitedEmail: normalizedEmail } : {}),
        ...(normalizedPhone ? { invitedPhoneNumber: normalizedPhone } : {}),
        invitedByUid: uid,
        role,
        functionalRoles,
        capabilities,
        spaces,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      });

      // Send invite email so they know to sign up (non-blocking)
      if (normalizedEmail) {
        const callerRecord = await admin.auth().getUser(uid);
        const callerName =
          callerRecord.displayName ?? callerRecord.email ?? uid;
        sendInviteEmail({
          toEmail: normalizedEmail,
          invitedByName: callerName,
          invitedByEmail: callerRecord.email ?? '',
          workspaceName,
          appId
        }).catch((err) =>
          logger.warn('workspaces-invitemember: invite email failed', err)
        );
      }

      logger.info('workspaces-invitemember pending', {
        appId,
        workspaceId,
        target: inviteTarget,
        invitedBy: uid
      });
      res.json({ status: 'pending', inviteId: inviteRef.id });
    }
  }
);

/**
 * Remove a member from a workspace.
 * - Owners can remove anyone except the last owner.
 * - Non-owners can only remove themselves.
 */
export const removemember = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-removemember');
    if (uid === undefined) return;

    const parsed = parseBody(
      removeMemberSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, workspaceId, targetUid } = parsed;
    const wsRef = workspaceRefForApp(appId, workspaceId);

    if (!(await requireWorkspaceMemberForApp(appId, workspaceId, uid, res)))
      return;

    const callerMemberSnap = await wsRef.collection('members').doc(uid).get();
    const callerRole = callerMemberSnap.data()?.['role'];
    const isOwner = callerRole === 'owner';
    const isSelf = uid === targetUid;

    if (!isOwner && !isSelf) {
      res.status(403).json({ error: 'Only owners can remove other members' });
      return;
    }

    const targetMemberSnap = await wsRef
      .collection('members')
      .doc(targetUid)
      .get();
    if (!targetMemberSnap.exists) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (targetMemberSnap.data()?.['role'] === 'owner') {
      const ownersSnap = await wsRef
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
      tx.delete(wsRef.collection('members').doc(targetUid));
      tx.delete(membershipIndexRefForApp(appId, targetUid, workspaceId));
    });

    logger.info('workspaces-removemember removed', {
      appId,
      workspaceId,
      targetUid,
      removedBy: uid
    });
    res.json({ status: 'removed', uid: targetUid });
  }
);

/**
 * Updates editable fields (displayName, photoUrl, email, phoneNumber, role) of a workspace member.
 * - displayName/photoUrl/email/phoneNumber: the member themselves or the workspace owner
 * - role: only the workspace owner
 *
 * POST body: { appId: string, workspaceId: string, memberUid: string, displayName?: string | null, photoUrl?: string | null, email?: string | null, phoneNumber?: string | null, role?: string }
 * Returns:   { success: true }
 */
export const updatemember = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-updatemember');
    if (uid === undefined) return;

    const parsed = parseBody(
      updateMemberSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const {
      appId,
      workspaceId,
      memberUid,
      displayName,
      photoUrl,
      email,
      phoneNumber,
      role,
      functionalRoles,
      spaces
    } = parsed;

    if (!(await requireWorkspaceMemberForApp(appId, workspaceId, uid, res)))
      return;

    const wsSnap = await workspaceRefForApp(appId, workspaceId).get();
    const isOwner = wsSnap.data()?.['ownerId'] === uid;

    if (displayName !== undefined && uid !== memberUid && !isOwner) {
      res.status(403).json({
        error: 'Only the member or workspace owner can update the display name'
      });
      return;
    }
    if (photoUrl !== undefined && uid !== memberUid && !isOwner) {
      res.status(403).json({
        error: 'Only the member or workspace owner can update the photo URL'
      });
      return;
    }
    if (email !== undefined && uid !== memberUid && !isOwner) {
      res.status(403).json({
        error: 'Only the member or workspace owner can update the email'
      });
      return;
    }
    if (phoneNumber !== undefined && uid !== memberUid && !isOwner) {
      res.status(403).json({
        error: 'Only the member or workspace owner can update the phone number'
      });
      return;
    }
    if (role !== undefined && !isOwner) {
      res
        .status(403)
        .json({ error: 'Only the workspace owner can update member roles' });
      return;
    }
    if (role === 'owner') {
      res.status(400).json({
        error: 'Use workspaces-transferownership to assign workspace ownership.'
      });
      return;
    }
    if (functionalRoles !== undefined && !isOwner) {
      res.status(403).json({
        error: 'Only the workspace owner can update functional roles'
      });
      return;
    }
    if (spaces !== undefined && !isOwner) {
      res.status(403).json({
        error: 'Only the workspace owner can update space access'
      });
      return;
    }

    const memberRef = workspaceRefForApp(appId, workspaceId)
      .collection('members')
      .doc(memberUid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const currentRole =
      (role ?? (memberSnap.data()?.['role'] as 'owner' | 'admin' | 'member')) ||
      'member';
    const nextFunctionalRoles =
      functionalRoles ??
      (memberSnap.data()?.['functionalRoles'] as string[] | undefined) ??
      [];
    const nextSpaces =
      spaces !== undefined
        ? spaces
        : ((memberSnap.data()?.['spaces'] as string[] | null | undefined) ??
          null);

    const updates: Record<string, unknown> = {};
    if (displayName !== undefined) {
      updates['displayName'] =
        displayName === null
          ? admin.firestore.FieldValue.delete()
          : displayName;
    }
    if (photoUrl !== undefined) {
      updates['photoUrl'] =
        photoUrl === null ? admin.firestore.FieldValue.delete() : photoUrl;
    }
    if (email !== undefined) {
      updates['email'] =
        email === null ? admin.firestore.FieldValue.delete() : email;
    }
    if (phoneNumber !== undefined) {
      updates['phoneNumber'] =
        phoneNumber === null
          ? admin.firestore.FieldValue.delete()
          : phoneNumber;
    }
    if (role !== undefined) updates['role'] = role;
    if (functionalRoles !== undefined) {
      updates['functionalRoles'] = functionalRoles;
    }
    if (spaces !== undefined) {
      updates['spaces'] = spaces;
    }
    if (role !== undefined || functionalRoles !== undefined) {
      updates['capabilities'] = deriveCapabilities(
        currentRole,
        nextFunctionalRoles
      );
    }

    await memberRef.set(updates, { merge: true });

    if (
      role !== undefined ||
      functionalRoles !== undefined ||
      spaces !== undefined
    ) {
      await membershipIndexRefForApp(appId, memberUid, workspaceId).set(
        {
          role: currentRole,
          functionalRoles: nextFunctionalRoles,
          capabilities: deriveCapabilities(currentRole, nextFunctionalRoles),
          spaces: nextSpaces,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    logger.info('workspaces-updatemember success', {
      uid,
      appId,
      workspaceId,
      memberUid
    });
    res.json({ success: true });
  }
);

export const transferownership = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-transferownership');
    if (uid === undefined) return;

    const parsed = parseBody(
      transferOwnershipSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, workspaceId, targetUid } = parsed;
    const wsRef = workspaceRefForApp(appId, workspaceId);
    const now = new Date().toISOString();

    const wsSnap = await wsRef.get();
    if (!wsSnap.exists) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    if (wsSnap.data()?.['ownerId'] !== uid) {
      res.status(403).json({
        error: 'Only the current workspace owner can transfer ownership'
      });
      return;
    }

    if (targetUid === uid) {
      res
        .status(400)
        .json({ error: 'This member is already the workspace owner' });
      return;
    }

    const currentOwnerRef = wsRef.collection('members').doc(uid);
    const targetMemberRef = wsRef.collection('members').doc(targetUid);
    const [currentOwnerSnap, targetMemberSnap] = await Promise.all([
      currentOwnerRef.get(),
      targetMemberRef.get()
    ]);

    if (!currentOwnerSnap.exists) {
      res.status(404).json({ error: 'Current owner membership not found' });
      return;
    }
    if (!targetMemberSnap.exists) {
      res.status(404).json({ error: 'Target member not found' });
      return;
    }

    const currentOwnerFunctionalRoles =
      (currentOwnerSnap.data()?.['functionalRoles'] as string[] | undefined) ??
      [];
    const targetFunctionalRoles =
      (targetMemberSnap.data()?.['functionalRoles'] as string[] | undefined) ??
      [];

    await db.runTransaction(async (tx) => {
      tx.set(
        wsRef,
        {
          ownerId: targetUid,
          updatedAt: now
        },
        { merge: true }
      );

      tx.set(
        currentOwnerRef,
        {
          role: 'member',
          capabilities: deriveCapabilities(
            'member',
            currentOwnerFunctionalRoles
          ),
          updatedAt: now
        },
        { merge: true }
      );

      tx.set(
        targetMemberRef,
        {
          role: 'owner',
          capabilities: deriveCapabilities('owner', targetFunctionalRoles),
          updatedAt: now
        },
        { merge: true }
      );

      tx.set(
        membershipIndexRefForApp(appId, uid, workspaceId),
        {
          role: 'member',
          capabilities: deriveCapabilities(
            'member',
            currentOwnerFunctionalRoles
          ),
          updatedAt: now
        },
        { merge: true }
      );

      tx.set(
        membershipIndexRefForApp(appId, targetUid, workspaceId),
        {
          role: 'owner',
          capabilities: deriveCapabilities('owner', targetFunctionalRoles),
          updatedAt: now
        },
        { merge: true }
      );
    });

    logger.info('workspaces-transferownership success', {
      appId,
      workspaceId,
      previousOwnerUid: uid,
      targetUid
    });
    res.json({ success: true, ownerUid: targetUid });
  }
);

export const updateprofile = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-updateprofile');
    if (uid === undefined) return;

    const parsed = parseBody(
      updateProfileSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, displayName, photoUrl } = parsed;
    const authPatch: { displayName?: string | null; photoURL?: string | null } =
      {};
    if (displayName !== undefined) authPatch.displayName = displayName;
    if (photoUrl !== undefined) authPatch.photoURL = photoUrl;

    await admin.auth().updateUser(uid, authPatch);

    const membershipsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc(appId)
      .collection('memberships')
      .get();

    let batch = db.batch();
    let batchSize = 0;
    const flushBatch = async () => {
      if (batchSize === 0) return;
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    };

    for (const membershipDoc of membershipsSnap.docs) {
      const workspaceId = membershipDoc.data()['workspaceId'] as
        | string
        | undefined;
      if (!workspaceId) continue;

      const memberRef = workspaceRefForApp(appId, workspaceId)
        .collection('members')
        .doc(uid);
      batch.set(
        memberRef,
        {
          ...(displayName !== undefined
            ? {
                displayName:
                  displayName === null
                    ? admin.firestore.FieldValue.delete()
                    : displayName
              }
            : {}),
          ...(photoUrl !== undefined
            ? {
                photoUrl:
                  photoUrl === null
                    ? admin.firestore.FieldValue.delete()
                    : photoUrl
              }
            : {}),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      batchSize += 1;

      if (batchSize >= 400) {
        await flushBatch();
      }
    }
    await flushBatch();

    logger.info('workspaces-updateprofile success', {
      uid,
      appId,
      membershipsUpdated: membershipsSnap.size,
      displayNameUpdated: displayName !== undefined,
      photoUrlUpdated: photoUrl !== undefined
    });
    res.json({ success: true, membershipsUpdated: membershipsSnap.size });
  }
);

export const uploadprofilephoto = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-uploadprofilephoto');
    if (uid === undefined) return;

    const parsed = parseBody(
      uploadProfilePhotoSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, fileName, mimeType, dataBase64 } = parsed;
    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.byteLength === 0) {
      res.status(400).json({ error: 'Image payload is empty' });
      return;
    }
    if (buffer.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Profile photo must be 5 MB or smaller' });
      return;
    }

    const extension =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : mimeType === 'image/gif'
            ? 'gif'
            : 'jpg';
    const downloadToken = randomUUID();
    const storagePath = `apps/${appId}/profile-photos/${uid}/${Date.now()}-${randomUUID()}.${extension}`;
    const file = admin.storage().bucket().file(storagePath);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
        cacheControl: 'public,max-age=3600',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalFileName: fileName
        }
      }
    });

    const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(file.bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    logger.info('workspaces-uploadprofilephoto success', {
      uid,
      appId,
      storagePath,
      mimeType,
      bytes: buffer.byteLength
    });
    res.json({ success: true, photoUrl });
  }
);

// ─── Delete Workspace ─────────────────────────────────────────────────────────

const deleteWorkspaceSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1)
});

/**
 * Deletes a workspace and all its subcollections (members, etc.).
 * Also removes every member's personal membership index entry.
 * Only the workspace owner may call this.
 *
 * POST body: { appId: string, workspaceId: string }
 * Returns:   { success: true }
 */
export const remove = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    if (!requireMethod(req, res, 'POST')) return;

    const uid = await requireAuth(req, res, 'workspaces-remove');
    if (uid === undefined) return;

    const parsed = parseBody(
      deleteWorkspaceSchema,
      req.body,
      res,
      'Invalid request'
    );
    if (parsed === undefined) return;

    const { appId, workspaceId } = parsed;
    const wsRef = workspaceRefForApp(appId, workspaceId);

    const wsSnap = await wsRef.get();
    if (!wsSnap.exists) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    if (wsSnap.data()?.['ownerId'] !== uid) {
      res
        .status(403)
        .json({ error: 'Only the workspace owner can delete a workspace' });
      return;
    }

    // Collect all member UIDs so we can remove their membership index entries.
    const membersSnap = await wsRef.collection('members').get();
    const memberUids = membersSnap.docs.map((d) => d.id);

    // Remove each member's personal membership index entry first (outside the
    // recursive delete scope since they live under users/, not apps/).
    const batch = db.batch();
    for (const memberUid of memberUids) {
      const indexRef = membershipIndexRefForApp(appId, memberUid, workspaceId);
      batch.delete(indexRef);
    }
    await batch.commit();

    // Recursively delete the workspace doc and all subcollections.
    await admin.firestore().recursiveDelete(wsRef);

    logger.info('workspaces-remove success', {
      uid,
      appId,
      workspaceId,
      membersRemoved: memberUids.length
    });
    res.json({ success: true });
  }
);
