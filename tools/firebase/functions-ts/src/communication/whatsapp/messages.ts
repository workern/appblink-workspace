// Firebase Functions v2 – WhatsApp Cloud API with Zod validation, auth checks, and Webhook Subscriptions

import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { checkRequest } from '../../utils';
import {
  getParsedTemplateMessage,
  getRefForConversation,
  getTemplate,
  graphApiRequest,
  updateConversationAndMessageToFirestore
} from './common';
import { whatsappAccessToken } from './constants';

import { db } from '../../global';
const senderNumber = '699461789919858';

/**
 * Core helper for sending any WhatsApp message
 */
async function sendWhatsAppMessageCore(phoneNumberId: string, payload: any) {
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
}

// --- Message Sending Schemas & Functions ---
// Common schema parts
const baseSendSchema = {
  phoneNumberId: z.string().nonempty(),
  to: z.string().nonempty()
};

/**
 * Unified sendMessage function supporting text and media
 */
export const sendmessage = onCall(
  { secrets: [whatsappAccessToken] },
  async (request) => {
    // schema allows type enum, plus text or media fields
    const schema = z.object({
      phoneNumberId: z.string().nonempty(),
      to: z.string().nonempty(),
      type: z.enum([
        'text',
        'image',
        'audio',
        'video',
        'document',
        'sticker',
        'reaction'
      ]),
      // text
      body: z.string().nonempty().optional(),
      preview_url: z.boolean().optional(),
      // media
      media_id: z.string().nonempty().optional(),
      link: z.string().url().optional(),
      caption: z.string().optional(),
      filename: z.string().optional(),
      // reaction
      message_id: z.string().optional(),
      emoji: z.string().optional(),
      // context for replies
      context_message_id: z.string().optional()
    });
    const data = request.data;
    data.phoneNumberId = data.phoneNumberId || senderNumber;

    await checkRequest(request, schema, true);

    const { phoneNumberId, to, type, context_message_id } = data;

    // build base payload
    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type
    };

    // add context if replying
    if (context_message_id) {
      payload.context = { message_id: context_message_id };
    }

    if (type === 'text') {
      payload.text = {
        body: data.text,
        preview_url: data.preview_url ?? false
      };
    } else if (type === 'reaction') {
      payload.reaction = { message_id: data.message_id, emoji: data.emoji };
    } else {
      // media types
      const mediaField = {} as any;
      if (data.media_id) mediaField.id = data.media_id;
      else if (data.link) mediaField.link = data.link;
      if (data.caption) mediaField.caption = data.caption;
      if (data.filename) mediaField.filename = data.filename;
      payload[type] = mediaField;
    }

    const res = await graphApiRequest(
      'post',
      `${phoneNumberId}/messages`,
      payload
    );

    await updateConversationAndMessageToFirestore(
      res,
      request.auth?.uid as string,
      to,
      phoneNumberId,
      null,
      { body: { text: data.text } }
    );
    return res.data;
  }
);

// Contacts
const contactSchema = z.object({
  ...baseSendSchema,
  contacts: z.array(z.any()).min(1),
  context_message_id: z.string().optional()
});
export const sendcontactmessage = onCall(async (request) => {
  await checkRequest(request, contactSchema);
  const { phoneNumberId, to, contacts, context_message_id } = request.data;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'contacts',
    contacts
  };
  if (context_message_id) payload.context = { message_id: context_message_id };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Location
const locationSchema = z.object({
  ...baseSendSchema,
  latitude: z.number(),
  longitude: z.number(),
  name: z.string().optional(),
  address: z.string().optional(),
  context_message_id: z.string().optional()
});
export const sendlocationmessage = onCall(async (request) => {
  await checkRequest(request, locationSchema);
  const {
    phoneNumberId,
    to,
    latitude,
    longitude,
    name,
    address,
    context_message_id
  } = request.data;
  const loc: any = { latitude, longitude };
  if (name) loc.name = name;
  if (address) loc.address = address;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'location',
    location: loc
  };
  if (context_message_id) payload.context = { message_id: context_message_id };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Message Templates
const templateBodySchema = z.object({
  phoneNumberId: z.string().nonempty(),
  to: z.string().nonempty(),
  name: z.string().nonempty(),
  language: z.string().nonempty(),
  components: z.array(z.any()).optional(),
  context_message_id: z.string().optional()
});
export const sendtemplatemessage = onCall(
  { secrets: [whatsappAccessToken] },
  async (request) => {
    const data = request.data;
    data.phoneNumberId = data.phoneNumberId || senderNumber;
    await checkRequest(request, templateBodySchema, true);
    const uid = request.auth?.uid as string;
    const {
      phoneNumberId,
      to,
      name,
      language,
      components,
      context_message_id
    } = data;
    const tpl: any = { name, language: { code: language } };
    if (components) tpl.components = components;
    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: tpl
    };
    if (context_message_id) {
      payload.context = { message_id: context_message_id };
    }

    const res = await graphApiRequest(
      'post',
      `${phoneNumberId}/messages`,
      payload
    );

    const template = await getTemplate(uid, name, '543946895375628');
    const parsedMessage = getParsedTemplateMessage(template, components);
    const contact = data.contact;

    await updateConversationAndMessageToFirestore(
      res,
      uid,
      to,
      phoneNumberId,
      template,
      parsedMessage,
      contact
    );
    return res.data;
  }
);

// Interactive: List, Buttons
const listSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  to: z.string().nonempty(),
  interactive: z.any(),
  context_message_id: z.string().optional()
});
export const sendlistmessage = onCall(async (request) => {
  await checkRequest(request, listSchema);
  const { phoneNumberId, to, interactive, context_message_id } = request.data;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  };
  if (context_message_id) payload.context = { message_id: context_message_id };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Buttons
const buttonSchema = listSchema;
export const sendbuttonmessage = onCall(async (request) => {
  await checkRequest(request, buttonSchema);
  const { phoneNumberId, to, interactive, context_message_id } = request.data;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  };
  if (context_message_id) payload.context = { message_id: context_message_id };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Mark as Read
const readSchema = z.object({
  phoneNumberId: z.string().nonempty(),
  message_id: z.string().nonempty()
});
export const markasread = onCall(async (request) => {
  await checkRequest(request, readSchema);
  const { phoneNumberId, message_id } = request.data;
  const payload = { messaging_product: 'whatsapp', status: 'read', message_id };
  const res = await graphApiRequest(
    'put',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Single Product
const productSchema = z.object({
  ...baseSendSchema,
  catalog_id: z.string().nonempty(),
  product_retailer_id: z.string().nonempty(),
  context_message_id: z.string().optional()
});
export const sendsingleproductmessage = onCall(async (request) => {
  await checkRequest(request, productSchema);
  const {
    phoneNumberId,
    to,
    catalog_id,
    product_retailer_id,
    context_message_id
  } = request.data;
  const interactive: any = {
    type: 'product',
    action: { catalog_id, product_retailer_id }
  };
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  };
  if (context_message_id) payload.context = { message_id: context_message_id };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

//Delete conversation
const deleteConversationSchema = z.object({
  to: z.string().nonempty()
});
export const deleteconversation = onCall(async (request) => {
  await checkRequest(request, deleteConversationSchema, true);
  const { conversationId } = request.data;
  await db.recursiveDelete(
    getRefForConversation(request.auth?.uid as string, conversationId)
  );
  return { success: true, message: 'Conversation deleted' };
});
