import { onCall, onRequest } from 'firebase-functions/https';
import { z } from 'zod';
import * as crypto from 'crypto';
import { checkRequest } from '../../utils/data.utils';
import {
  getConversationSnapByPhoneNumber,
  getMessageRef,
  getRefForConversation,
  graphApiRequest
} from './common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { log, warn } from 'firebase-functions/logger';
import { Conversation, Message } from './interfaces';
import { db, META_APP_SECRET } from '../../global';
import { whatsappAccessToken } from './constants';
const VERIFY_TOKEN = 'shambho';

function isValidSignature(
  rawBody: Buffer,
  signature: string | undefined,
  appSecret: string
): boolean {
  if (!signature) {
    warn('Missing x-hub-signature-256 header');
    return false;
  }
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Zod schemas
const wabaSchema = z.object({ wabaId: z.string().nonempty() });
const subscribeSchema = z.object({ wabaId: z.string().nonempty() });
const overrideSchema = z.object({
  wabaId: z.string().nonempty(),
  override_callback_uri: z.string().url(),
  verify_token: z.string().nonempty()
});

/**
 * Subscribe app to a WABA for Webhooks
 * onCall({ wabaId })
 */
export const subscribeToWaba = onCall(async (request) => {
  await checkRequest(request, subscribeSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('post', `${wabaId}/subscribed_apps`);
  return res.data;
});

/**
 * List all Webhook subscriptions for a WABA
 * onCall({ wabaId })
 */
export const listWabaSubscriptions = onCall(async (request) => {
  await checkRequest(request, wabaSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('get', `${wabaId}/subscribed_apps`);
  return res.data;
});

/**
 * Unsubscribe app from a WABA
 * onCall({ wabaId })
 */
export const unsubscribeFromWaba = onCall(async (request) => {
  await checkRequest(request, wabaSchema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('delete', `${wabaId}/subscribed_apps`);
  return res.data;
});

/**
 * Override callback URL for a WABA subscription
 * onCall({ wabaId, override_callback_uri, verify_token })
 */
export const overrideCallbackUrl = onCall(async (request) => {
  await checkRequest(request, overrideSchema, true);
  const { wabaId, override_callback_uri, verify_token } = request.data;
  const payload = { override_callback_uri, verify_token };
  const res = await graphApiRequest(
    'post',
    `${wabaId}/subscribed_apps`,
    payload
  );
  return res.data;
});

/**
 * Webhook HTTP handler
 */
export const handler = onRequest(
  { secrets: [whatsappAccessToken, META_APP_SECRET] },
  async (req, res) => {
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Forbidden');
      }
    } else if (req.method === 'POST') {
      const signature = req.headers['x-hub-signature-256'] as
        | string
        | undefined;
      if (!isValidSignature(req.rawBody, signature, META_APP_SECRET.value())) {
        warn('Invalid webhook signature — request rejected');
        res.status(403).send('Invalid signature');
        return;
      }

      const change = req.body.entry[0].changes[0].value;
      log('Received change:', change);
      if (change.messages?.length > 0) {
        log('Handling messages:');
        await handleMessages(change);
      } else if (change.statuses?.length > 0) {
        log('Handling statuses:');
        await handleStatuses(change);
      } else if (change.message_template_name != null) {
        handleTemplateChange(change);
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(405);
    }
  }
);

async function handleMessages(change) {
  const businessPhoneNumberId = change.metadata.phone_number_id;

  for await (const message of change.messages) {
    const senderWaId = message.from;
    const messageId = message.id;
    const textBody = message.text?.body || null;
    const tsMillis = Number(message.timestamp) * 1000;
    let conversationSnap;

    conversationSnap = await getConversationSnapByPhoneNumber(
      businessPhoneNumberId,
      senderWaId
    );

    if (!conversationSnap.empty) {
      const conversationData = conversationSnap.docs[0].data() as Conversation;
      const uid = conversationData.business.uid;
      const to = conversationData.id;

      await getRefForConversation(uid, to).update({
        updatedAt: FieldValue.serverTimestamp(),
        lastMessage: textBody || '',
        lastMessageId: messageId
      });
      const messageObj: Message = {
        id: messageId,
        type: 'text',
        body: textBody || '',
        status: 'delivered',
        createdAt: Timestamp.fromMillis(tsMillis),
        updatedAt: Timestamp.fromMillis(tsMillis),
        sender: 'customer',
        receiver: 'business'
      };

      await getMessageRef(uid, to, messageId).set(messageObj);
    }
  }
}

async function handleStatuses(change) {
  const businessPhoneNumberId = change.metadata.phone_number_id;
  for await (const statusObj of change.statuses) {
    const messageId = statusObj.id;
    const tsMillis = Number(statusObj.timestamp) * 1000;
    const conversationSnap = await getConversationSnapByPhoneNumber(
      businessPhoneNumberId,
      statusObj.recipient_id
    );
    if (!conversationSnap.empty) {
      const conversationData = conversationSnap.docs[0].data() as Conversation;
      const uid = conversationData.business.uid;
      const to = conversationData.id;
      try {
        await getMessageRef(uid, to, messageId).update({
          status: statusObj.status,
          updatedAt: Timestamp.fromMillis(tsMillis)
        });
      } catch (error) {
        log('Error handling status:', error);
        continue;
      }
    }
  }
}

async function handleTemplateChange(change) {
  const templateId = change.message_template_id;
  log('template id', templateId);
  const templateSnaps = await db
    .collectionGroup('templates')
    .where('id', '==', `${templateId}`)
    .get();
  log('templateSnaps', templateSnaps.docs.length);
  if (templateSnaps.docs.length > 0) {
    const templateSnap = templateSnaps.docs[0];
    const res = await graphApiRequest('get', `${templateId}`);
    const templateData = res.data;
    templateData.components = templateData.components.map((c) => {
      delete c.example;
      return c;
    });
    await templateSnap.ref.set(
      {
        ...templateData,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    log('Template updated:', templateData.name);
  }
}
