import { admin, db, firestoreWriteTimestamp } from './global';
import { Notification } from './models/notification';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { WorkernNotification } from '@workern/models';

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
export const onNotificationCreated = onDocumentCreated(
  {
    document: 'users/{uid}/mySpaces/{spaceId}/notifications/{notificationId}',
    region: 'asia-south1'
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
 * Helper: Build FCM message payload
 */
function buildFCMMessage(
  notification: WorkernNotification,
  notificationId: string,
  spaceId: string
) {
  return {
    notification: {
      title: notification.title,
      body: notification.description
    },
    data: {
      notificationId: notificationId,
      spaceId: spaceId,
      type: notification.type,
      ...(notification.data || {})
    },
    android: {
      ttl: 24 * 60 * 60, // 24 hours
      priority: 'high' as const
    },
    apns: {
      headers: {
        'apns-priority': '10'
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
  return Promise.all(
    deviceTokens.map(({ platform, token }) =>
      admin
        .messaging()
        .send({ ...message, token } as admin.messaging.Message)
        .then(() => {
          console.log(`✅ Sent to ${platform}`);
          return { platform, token, success: true };
        })
        .catch((error) => {
          console.error(`Error sending to ${platform}:`, error.code);
          return { platform, token, success: false, reason: error.code };
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
