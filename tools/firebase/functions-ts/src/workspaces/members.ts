/**
 * workspaces/members.ts
 *
 * onCall equivalents of the onRequest workspace member management functions
 * so that Angular/Flutter apps can use httpsCallable instead of raw HTTP.
 *
 * Any app that stores staff/members under
 *   apps/{appId}/workspaces/{workspaceId}/members/{uid}
 * can use these by passing { appId, workspaceId, ... }.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { logger } from 'firebase-functions';
import type { UserRecord } from 'firebase-admin/auth';
import { admin, db, deployOptions } from '../global';
import { memberRef, membershipIndexRef, workspaceRef } from './helpers';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const addMemberSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  /** Firebase UID of the user being added. They must already have an account. */
  targetUid: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
  displayName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/)
    .optional(),
  photoUrl: z.string().url().optional(),
  /** App-specific extra fields stored alongside the workspace member doc. */
  extraFields: z.record(z.string(), z.unknown()).optional()
});

const updateMemberSchema = z
  .object({
    appId: z.string().min(1),
    workspaceId: z.string().min(1),
    targetUid: z.string().min(1),
    role: z.enum(['owner', 'admin', 'member']).optional(),
    displayName: z.string().max(100).nullable().optional(),
    email: z.string().email().nullable().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/)
      .nullable()
      .optional(),
    photoUrl: z.string().url().nullable().optional(),
    extraFields: z.record(z.string(), z.unknown()).optional()
  })
  .refine(
    (d) =>
      d.role !== undefined ||
      d.displayName !== undefined ||
      d.email !== undefined ||
      d.phoneNumber !== undefined ||
      d.photoUrl !== undefined ||
      d.extraFields !== undefined,
    'At least one field to update must be provided'
  );

const removeMemberSchema = z.object({
  appId: z.string().min(1),
  workspaceId: z.string().min(1),
  targetUid: z.string().min(1)
});

const inviteMemberOnCallSchema = z
  .object({
    appId: z.string().min(1),
    workspaceId: z.string().min(1),
    email: z.string().email().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/)
      .optional(),
    role: z.enum(['owner', 'admin', 'member']).default('member'),
    /** App-specific extra fields stored on both the member doc and pending invite. */
    extraFields: z.record(z.string(), z.unknown()).optional()
  })
  .refine(
    (d) => {
      const hasEmail = Boolean(d.email?.trim());
      const hasPhone = Boolean(d.phoneNumber?.trim());
      return (hasEmail || hasPhone) && !(hasEmail && hasPhone);
    },
    { message: 'Provide exactly one invite target: email or phoneNumber' }
  );

// ─── Notification Helpers ────────────────────────────────────────────────────

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

// ─── Helper ───────────────────────────────────────────────────────────────────

async function assertWorkspaceAdmin(
  appId: string,
  workspaceId: string,
  callerUid: string
): Promise<void> {
  const callerMemberSnap = await memberRef(appId, workspaceId, callerUid).get();
  if (!callerMemberSnap.exists) {
    throw new HttpsError('permission-denied', 'Not a member of this workspace');
  }
  const role = callerMemberSnap.data()?.role;
  if (role !== 'owner' && role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Only workspace owners or admins can manage members'
    );
  }
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Invites a user by email or phone number to a workspace.
 * - If the user already has a Firebase account: adds them directly + sends
 *   an in-app notification (and an invite email if an email was provided).
 * - If no account exists yet: writes a pending invite doc so it is auto-accepted
 *   when they sign up via `acceptPendingInvitesForUser`.
 * The caller must be a workspace owner or admin.
 * Pass `extraFields` to store app-specific metadata (e.g. NSM role/permissions)
 * on the member doc; they are also stored on the pending invite so they are
 * applied when the invite is accepted.
 *
 * Deployed as `workspaces-invitememberoncall`.
 */
export const invitememberoncall = onCall(
  { ...deployOptions },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const parsed = inviteMemberOnCallSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        'invalid-argument',
        parsed.error.issues.map((i) => i.message).join(', ')
      );
    }

    const { appId, workspaceId, email, phoneNumber, role, extraFields } =
      parsed.data;
    const callerUid = request.auth.uid;

    await assertWorkspaceAdmin(appId, workspaceId, callerUid);

    const wsSnap = await workspaceRef(appId, workspaceId).get();
    if (!wsSnap.exists) {
      throw new HttpsError(
        'not-found',
        `Workspace ${workspaceId} not found for app ${appId}`
      );
    }
    const workspaceName: string = wsSnap.data()?.name ?? workspaceId;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phoneNumber?.trim();
    const now = new Date().toISOString();

    // ── Try to resolve an existing Firebase account ──────────────────────────
    let user: UserRecord | null = null;
    try {
      user = normalizedEmail
        ? await admin.auth().getUserByEmail(normalizedEmail)
        : await admin.auth().getUserByPhoneNumber(normalizedPhone!);
    } catch (err: unknown) {
      const isNotFound =
        err instanceof Error &&
        ((err as { code?: string }).code === 'auth/user-not-found' ||
          err.message.includes('There is no user record'));
      if (!isNotFound) {
        logger.error('invitememberoncall: auth lookup failed', err);
        throw new HttpsError('internal', 'Failed to look up user');
      }
    }

    if (user) {
      const inviteeUid = user.uid;

      // Already a member?
      const existingSnap = await memberRef(
        appId,
        workspaceId,
        inviteeUid
      ).get();
      if (existingSnap.exists) {
        return { status: 'already_member', uid: inviteeUid };
      }

      const memberDoc = {
        uid: inviteeUid,
        role,
        functionalRoles: [],
        capabilities: [],
        spaces: null,
        joinedAt: now,
        ...((user.email ?? normalizedEmail)
          ? { email: user.email ?? normalizedEmail }
          : {}),
        ...(user.displayName ? { displayName: user.displayName } : {}),
        ...(user.photoURL ? { photoUrl: user.photoURL } : {}),
        ...((user.phoneNumber ?? normalizedPhone)
          ? { phoneNumber: user.phoneNumber ?? normalizedPhone }
          : {}),
        ...(extraFields ?? {})
      };

      const indexDoc = {
        workspaceId,
        name: workspaceName,
        role,
        functionalRoles: [],
        capabilities: [],
        spaces: null,
        updatedAt: now,
        ...((user.email ?? normalizedEmail)
          ? { email: user.email ?? normalizedEmail }
          : {}),
        ...(user.displayName ? { displayName: user.displayName } : {})
      };

      const batch = db.batch();
      batch.set(memberRef(appId, workspaceId, inviteeUid), memberDoc, {
        merge: true
      });
      batch.set(membershipIndexRef(appId, inviteeUid, workspaceId), indexDoc, {
        merge: true
      });
      await batch.commit();

      // Notify (non-blocking)
      const callerRecord = await admin.auth().getUser(callerUid);
      const callerName =
        callerRecord.displayName ?? callerRecord.email ?? callerUid;
      Promise.all([
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
        logger.warn('invitememberoncall: notification failed', err)
      );

      logger.info('invitememberoncall: added existing user', {
        appId,
        workspaceId,
        inviteeUid,
        callerUid
      });
      return { status: 'added', uid: inviteeUid };
    }

    // ── User not found → create pending invite ────────────────────────────────
    const inviteRef = db
      .collection('apps')
      .doc(appId)
      .collection('invites')
      .doc();

    await inviteRef.set({
      id: inviteRef.id,
      appId,
      workspaceId,
      workspaceName,
      ...(normalizedEmail ? { invitedEmail: normalizedEmail } : {}),
      ...(normalizedPhone ? { invitedPhoneNumber: normalizedPhone } : {}),
      invitedByUid: callerUid,
      role,
      functionalRoles: [],
      capabilities: [],
      spaces: null,
      ...(extraFields ? { extraFields } : {}),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    // Send invite email (non-blocking)
    if (normalizedEmail) {
      const callerRecord = await admin.auth().getUser(callerUid);
      const callerName =
        callerRecord.displayName ?? callerRecord.email ?? callerUid;
      sendInviteEmail({
        toEmail: normalizedEmail,
        invitedByName: callerName,
        invitedByEmail: callerRecord.email ?? '',
        workspaceName,
        appId
      }).catch((err) =>
        logger.warn('invitememberoncall: invite email failed', err)
      );
    }

    logger.info('invitememberoncall: pending invite created', {
      appId,
      workspaceId,
      target: normalizedEmail ?? normalizedPhone,
      callerUid
    });
    return { status: 'pending', inviteId: inviteRef.id };
  }
);

/**
 * Directly adds a user (who already has a Firebase account) as a workspace
 * member when you already know their UID. The caller must be a workspace owner
 * or admin. For invite-by-email/phone use `invitememberoncall` instead.
 */
export const addspacemember = onCall({ ...deployOptions }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const parsed = addMemberSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError(
      'invalid-argument',
      parsed.error.issues.map((i) => i.message).join(', ')
    );
  }

  const {
    appId,
    workspaceId,
    targetUid,
    role,
    displayName,
    email,
    phoneNumber,
    photoUrl,
    extraFields
  } = parsed.data;

  await assertWorkspaceAdmin(appId, workspaceId, request.auth.uid);

  // Ensure workspace doc exists
  const wsSnap = await workspaceRef(appId, workspaceId).get();
  if (!wsSnap.exists) {
    throw new HttpsError(
      'not-found',
      `Workspace ${workspaceId} not found for app ${appId}`
    );
  }
  const workspaceName: string = wsSnap.data()?.name ?? workspaceId;

  const now = new Date().toISOString();
  const mRef = memberRef(appId, workspaceId, targetUid);
  const idxRef = membershipIndexRef(appId, targetUid, workspaceId);

  const memberDoc = {
    uid: targetUid,
    role,
    functionalRoles: [],
    capabilities: [],
    spaces: null,
    joinedAt: now,
    ...(displayName ? { displayName } : {}),
    ...(email ? { email } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(extraFields ?? {})
  };

  const indexDoc = {
    workspaceId,
    name: workspaceName,
    role,
    functionalRoles: [],
    capabilities: [],
    spaces: null,
    updatedAt: now,
    ...(displayName ? { displayName } : {}),
    ...(email ? { email } : {})
  };

  const batch = db.batch();
  batch.set(mRef, memberDoc, { merge: true });
  batch.set(idxRef, indexDoc, { merge: true });
  await batch.commit();

  logger.info('workspaces-addspacemember success', {
    appId,
    workspaceId,
    targetUid,
    callerUid: request.auth.uid
  });

  return { success: true, uid: targetUid };
});

/**
 * Updates an existing workspace member's fields. Caller must be owner or admin.
 * Pass `extraFields` for app-specific metadata stored on the member doc.
 */
export const updatespacemember = onCall(
  { ...deployOptions },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const parsed = updateMemberSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        'invalid-argument',
        parsed.error.issues.map((i) => i.message).join(', ')
      );
    }

    const {
      appId,
      workspaceId,
      targetUid,
      role,
      displayName,
      email,
      phoneNumber,
      photoUrl,
      extraFields
    } = parsed.data;

    await assertWorkspaceAdmin(appId, workspaceId, request.auth.uid);

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (role !== undefined) updates['role'] = role;
    if (displayName !== undefined) updates['displayName'] = displayName;
    if (email !== undefined) updates['email'] = email;
    if (phoneNumber !== undefined) updates['phoneNumber'] = phoneNumber;
    if (photoUrl !== undefined) updates['photoUrl'] = photoUrl;
    if (extraFields) Object.assign(updates, extraFields);

    const batch = db.batch();
    batch.update(memberRef(appId, workspaceId, targetUid), updates);
    // Mirror role change to personal index
    if (role !== undefined) {
      batch.update(membershipIndexRef(appId, targetUid, workspaceId), {
        role,
        updatedAt: now
      });
    }
    await batch.commit();

    logger.info('workspaces-updatespacemember success', {
      appId,
      workspaceId,
      targetUid,
      callerUid: request.auth.uid
    });

    return { success: true };
  }
);

/**
 * Removes a member from the workspace. Caller must be owner or admin.
 * Deletes both the member doc and the personal membership index entry.
 */
export const removespacemember = onCall(
  { ...deployOptions },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const parsed = removeMemberSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        'invalid-argument',
        parsed.error.issues.map((i) => i.message).join(', ')
      );
    }

    const { appId, workspaceId, targetUid } = parsed.data;

    await assertWorkspaceAdmin(appId, workspaceId, request.auth.uid);

    // Prevent removing the workspace owner
    const targetSnap = await memberRef(appId, workspaceId, targetUid).get();
    if (targetSnap.exists && targetSnap.data()?.role === 'owner') {
      throw new HttpsError(
        'failed-precondition',
        'Cannot remove the workspace owner. Transfer ownership first.'
      );
    }

    const batch = db.batch();
    batch.delete(memberRef(appId, workspaceId, targetUid));
    batch.delete(membershipIndexRef(appId, targetUid, workspaceId));
    await batch.commit();

    logger.info('workspaces-removespacemember success', {
      appId,
      workspaceId,
      targetUid,
      callerUid: request.auth.uid
    });

    return { success: true };
  }
);
