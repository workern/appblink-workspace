import { admin, db, firestoreWriteTimestamp } from '../global';
import { Notification } from '../models/notification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { WorkernNotification } from '@workern/models';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

interface DeviceToken {
  platform: string;
  token: string;
}

interface SendResult {
  platform: string;
  token: string;
  success: boolean;
  reason?: string;
}

export function sendNotification(
  uid: string,
  message: string,
  routerLink: string
) {
  const notificationRef = db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .doc();
  const notification = new Notification({
    createdAt: firestoreWriteTimestamp,
    title: message,
    description: message,
    receiver: { uid: uid },
    type: 'notification',
    data: { routerLink: routerLink },
    seen: false,
    id: notificationRef.id
  });
  return notificationRef.set(notification.forFirestore());
}

/**
 * V2: Sends notifications via Firebase Cloud Messaging with multi-device support
 * Uses onDocumentCreated (v2 SDK) for cleaner API
 * Triggered when documents are created in: users/{uid}/mySpaces/{spaceId}/notifications
 *
 * Features:
 * - Supports multiple devices per platform (android, ios, web)
 * - Automatic cleanup of invalid tokens
 * - Comprehensive logging for debugging
 * - Error resilience with partial success handling
 */
export const oncreate = onDocumentCreated(
  {
    document: 'users/{uid}/mySpaces/{spaceId}/notifications/{notificationId}',
    region: 'asia-south2'
  },
  async (event) => {
    try {
      const notification = event.data?.data() as WorkernNotification;
      const { uid, spaceId } = event.params;

      console.log('📬 V2 Notification trigger:', {
        userId: uid,
        spaceId: spaceId,
        notificationId: event.params.notificationId,
        title: notification.title
      });

      // Get device tokens for this space
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (!userDoc.exists) {
        console.warn(`User document not found for uid: ${uid}`);
        return;
      }
      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || {};
      console.log(`🔍 Debug user FCM configuration:`, {
        uid,
        hasFcmTokensField: !!userData?.fcmTokens,
        allSpacesWithTokens: Object.keys(fcmTokens),
        tokensForTargetSpace: fcmTokens[spaceId] || null
      });

      const deviceTokens = await getDeviceTokensForSpace(uid, spaceId);

      if (deviceTokens.length === 0) {
        console.warn('No FCM tokens found for space:', spaceId);
        return;
      }

      logTokensInfo(deviceTokens);

      // Build FCM message
      const message = buildFCMMessage(
        notification,
        event.params.notificationId,
        spaceId
      );

      console.log('📦 FCM Payload:', JSON.stringify(message, null, 2));

      // Send to all devices and track results
      const results = await sendToAllDevices(message, deviceTokens);

      // Handle invalid tokens
      await cleanupInvalidTokens(uid, spaceId, results);

      // Log summary
      logDeliverySummary(results);
    } catch (error) {
      console.error('❌ Error in notification trigger:', error);
      throw error;
    }
  }
);

/**
 * Helper: Get all device tokens for a space
 */
async function getDeviceTokensForSpace(
  uid: string,
  spaceId: string
): Promise<DeviceToken[]> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();

  if (!userDoc.exists) {
    console.warn('User document not found:', uid);
    return [];
  }

  const userData = userDoc.data();
  const fcmTokens =
    (userData?.fcmTokens as Record<string, Record<string, string[]>>) || {};
  const spaceTokens = (fcmTokens[spaceId] as Record<string, string[]>) || {};

  const deviceTokens: DeviceToken[] = [];

  Object.entries(spaceTokens).forEach(([platform, tokens]) => {
    if (Array.isArray(tokens)) {
      tokens.forEach((token) => {
        if (token && token.trim().length > 0) {
          deviceTokens.push({ platform, token });
        }
      });
    }
  });

  return deviceTokens;
}

/**
 * Helper: Map spaceId to Android Notification Channel ID
 */
function getChannelIdForSpace(spaceId: string): string {
  switch (spaceId) {
    case 'nikat':
    case 'nikat-shop-manager':
      return 'orders';
    case 'nikat-delivery':
      return 'delivery_notifications';
    case 'workern-admin':
      return 'admin_notifications';
    case 'turk-guru':
      return 'turk_guru_channel';
    case 'app-blink':
      return 'app_blink_channel';
    case 'net-worth-calculator':
      return 'net_worth_calculator_channel';
    case 'save-nest':
      return 'save_nest_channel';
    case 'utsav':
      return 'utsav_channel';
    case 'deskflow-pro':
      return 'deskflow_pro_channel';
    case 'pravah':
      return 'pravah_channel';
    case 'gallery-cleaner':
      return 'gallery_cleaner_channel';
    case 'content-creator':
    case 'promotions':
    case 'starter-app':
      return 'starter_app_channel';
    default:
      return `${spaceId.replace(/-/g, '_')}_channel`;
  }
}

/**
 * Helper: Build FCM message payload
 */
function buildFCMMessage(
  notification: WorkernNotification,
  notificationId: string,
  spaceId: string
) {
  const channelId = getChannelIdForSpace(spaceId);
  return {
    notification: {
      title: notification.title,
      body: notification.description,
      ...(notification.imageUrl ? { image: notification.imageUrl } : {})
    },
    data: {
      notificationId: notificationId,
      spaceId: spaceId,
      type: notification.type,
      ...(notification.imageUrl ? { imageUrl: notification.imageUrl } : {}),
      ...(notification.data || {})
    },
    android: {
      ttl: 24 * 60 * 60, // 24 hours
      priority: 'high' as const,
      notification: {
        channelId: channelId,
        priority: 'high' as const,
        sound: 'default',
        defaultSound: true,
        defaultVibrateTimings: true,
        icon: 'ic_launcher'
      }
    },
    apns: {
      headers: {
        'apns-priority': '10'
      },
      payload: {
        aps: {
          'mutable-content': 1,
          sound: 'default'
        }
      }
    }
  };
}

/**
 * Helper: Send message to all devices
 */
async function sendToAllDevices(
  message: any,
  deviceTokens: DeviceToken[]
): Promise<SendResult[]> {
  console.log(`📡 Sending FCM message to ${deviceTokens.length} devices...`);

  const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  if (isEmulator && !hasCredentials) {
    console.warn(
      '⚠️ Skipping FCM delivery in Emulator because GOOGLE_APPLICATION_CREDENTIALS is not set. ' +
      'To receive actual push notifications on your device, set GOOGLE_APPLICATION_CREDENTIALS ' +
      'pointing to your service account key JSON file before starting the emulators.'
    );
    return deviceTokens.map(({ platform, token }) => ({
      platform,
      token,
      success: false,
      reason: 'emulator-missing-credentials'
    }));
  }

  return Promise.all(
    deviceTokens.map(({ platform, token }) =>
      admin
        .messaging()
        .send({ ...message, token } as any)
        .then((response) => {
          console.log(`✅ Successfully sent to ${platform}. Message ID: ${response}`);
          return { platform, token, success: true };
        })
        .catch((error) => {
          console.error(`❌ Failed to send to ${platform}:`, {
            code: error.code,
            message: error.message,
            stack: error.stack,
            error
          });
          return { platform, token, success: false, reason: error.code || error.message };
        })
    )
  );
}

/**
 * Helper: Clean up invalid tokens from Firestore
 */
async function cleanupInvalidTokens(
  uid: string,
  spaceId: string,
  results: SendResult[]
): Promise<void> {
  const invalidTokens = results.filter(
    (r) =>
      !r.success &&
      (r.reason === 'messaging/invalid-registration-token' ||
        r.reason === 'messaging/registration-token-not-registered')
  );

  if (invalidTokens.length === 0) return;

  const updates: Record<string, any> = {};

  invalidTokens.forEach(({ platform, token }) => {
    const fieldPath = `fcmTokens.${spaceId}.${platform}`;
    updates[fieldPath] = admin.firestore.FieldValue.arrayRemove([token]);
    console.warn(`Removing invalid ${platform} token for space ${spaceId}`);
  });

  if (Object.keys(updates).length > 0) {
    updates['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();

    try {
      await admin.firestore().collection('users').doc(uid).update(updates);
      console.log(`✅ Cleaned up ${invalidTokens.length} invalid tokens`);
    } catch (error) {
      console.error('Failed to cleanup invalid tokens:', error);
    }
  }
}

/**
 * Helper: Log delivery summary
 */
function logTokensInfo(deviceTokens: DeviceToken[]): void {
  const tokensByPlatform = deviceTokens.reduce(
    (acc, dt) => {
      acc[dt.platform] = (acc[dt.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('📱 Device tokens by platform:', tokensByPlatform);
}

/**
 * Helper: Log delivery summary
 */
function logDeliverySummary(results: SendResult[]): void {
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log('📊 Delivery summary:', {
    total: results.length,
    succeeded: successCount,
    failed: failureCount
  });
}

/**
 * Callable: Marks a notification as seen or unseen.
 * Path: users/{uid}/mySpaces/{spaceId}/notifications/{notificationId}
 */
export const markseen = onCall({ region: 'asia-south2' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const schema = z.object({
    spaceId: z.string().min(1),
    notificationId: z.string().min(1),
    seen: z.boolean().optional().default(true)
  });

  const result = schema.safeParse(request.data);
  if (!result.success) {
    throw new HttpsError('invalid-argument', result.error.issues[0].message);
  }

  const { spaceId, notificationId, seen } = result.data;
  const userId = request.auth.uid;

  await db
    .collection('users')
    .doc(userId)
    .collection('mySpaces')
    .doc(spaceId)
    .collection('notifications')
    .doc(notificationId)
    .update({
      seen,
      updatedAt: firestoreWriteTimestamp
    });

  return { success: true };
});

/**
 * Callable: Deletes a notification.
 * Path: users/{uid}/mySpaces/{spaceId}/notifications/{notificationId}
 */
export const remove = onCall({ region: 'asia-south2' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const schema = z.object({
    spaceId: z.string().min(1),
    notificationId: z.string().min(1)
  });

  const result = schema.safeParse(request.data);
  if (!result.success) {
    throw new HttpsError('invalid-argument', result.error.issues[0].message);
  }

  const { spaceId, notificationId } = result.data;
  const userId = request.auth.uid;

  await db
    .collection('users')
    .doc(userId)
    .collection('mySpaces')
    .doc(spaceId)
    .collection('notifications')
    .doc(notificationId)
    .delete();

  return { success: true };
});
