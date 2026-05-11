/**
 * Generic Graph API request helper
 */
import axios from 'axios';
import { logger } from 'firebase-functions';
import { whatsappAccessToken, GRAPH_API_VERSION } from './constants';
import { log } from 'firebase-functions/logger';
import { db } from '../../global';
import { FieldValue } from 'firebase-admin/firestore';

export async function graphApiRequest(method, path, data = {}, params = {}) {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`;
  const config = {
    headers: { Authorization: `Bearer ${whatsappAccessToken.value()}` },
    params
  };
  try {
    if (method === 'get') return await axios.get(url, config);
    if (method === 'post') return await axios.post(url, data, config);
    if (method == 'delete') return await axios.delete(url, config);
    throw new Error(`Unsupported method: ${method}`);
  } catch (err) {
    logger.error(
      `Graph API error [${method.toUpperCase()} ${path}]:`,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error?.message || err.message);
  }
}

export function getMessengerAppSpaceRef(uid: string) {
  return db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc('messengerAppSpace');
}

export async function getTemplate(uid: string, name: string, wabaId: string) {
  const templateRef = getMessengerAppSpaceRef(uid)
    .collection('templates')
    .doc(name);
  let template = (await templateRef.get()).data();
  if (!template) {
    const res = await graphApiRequest(
      'get',
      `${wabaId}/message_templates`,
      {},
      { name }
    );
    template = res.data.data[0];
    log('Fetched template from Graph API:', template);

    await templateRef.set(template);
  }
  return template;
}

export function getRefForConversation(
  businessUID: string,
  customerPhoneNumber: string
) {
  return db
    .collection('users')
    .doc(businessUID)
    .collection('mySpaces')
    .doc('messengerAppSpace')
    .collection('conversations')
    .doc(customerPhoneNumber);
}

export function getMessageRef(
  businessUID: string,
  customerPhoneNumber: string,
  messageId: string
) {
  log(
    'messageRef',
    getRefForConversation(businessUID, customerPhoneNumber)
      .collection('messages')
      .doc(messageId).path
  );
  return getRefForConversation(businessUID, customerPhoneNumber)
    .collection('messages')
    .doc(messageId);
}

export function getParsedTemplateMessage(template: any, components: any[]) {
  const parsed = template.components.map((c) => {
    const templateContent = c.text || '';
    const regex = /{{\s*(\d+)\s*}}/g;
    const matches = templateContent.match(regex) || [];
    const uniqueVars = [
      ...new Set(matches.map((m) => parseInt(m.replace(/{|}/g, ''))))
    ];
    const vars = uniqueVars.sort((a: number, b: number) => a - b);

    const parameters =
      components?.find((comp) => {
        return comp.type.toLowerCase() === c.type.toLowerCase();
      })?.parameters || [];
    let content = templateContent;
    if (vars.length > 0 && parameters?.length > 0) {
      vars.forEach((varNum, index) => {
        const sample = parameters[index].text || `[${varNum}]`;
        const regex = new RegExp(`{{\\s*${varNum}\\s*}}`, 'g');
        content = content.replace(regex, sample);
      });
    }
    c.text = content;
    return c;
  });
  return {
    body: parsed.find((c) => c.type == 'BODY'),
    components: parsed
  };
}

export function getMessageSnapById(messageId) {
  log('Finding message by ID:', messageId);
  return new Promise((resolve, reject) => {
    db.collectionGroup('messages')
      .where('id', '==', messageId)
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const messageSnap = snapshot.docs[0];
          log('Message found:', messageSnap.id);
          resolve(messageSnap);
        }
      });
    setTimeout(() => {
      log('No message found for ID:', messageId);
      resolve(null);
    }, 10000);
  });
}

export async function getConversationSnapByPhoneNumber(
  businessPhoneNumberId: string,
  customerPhoneNumber: string
) {
  return db
    .collectionGroup('conversations')
    .where('business.phoneNumberId', '==', businessPhoneNumberId)
    .where('customer.displayPhoneNumber', '==', customerPhoneNumber)
    .get();
}

export async function updateConversationAndMessageToFirestore(
  graphApiResponse: any,
  uid: string,
  to: string,
  phoneNumberId: string,
  template?,
  parsedMessage?,
  contact?
) {
  const message = graphApiResponse.data.messages?.[0];
  await getRefForConversation(uid, to).set(
    {
      id: to,
      updatedAt: FieldValue.serverTimestamp(),

      business: {
        phoneNumberId: phoneNumberId,
        uid: uid
      },
      lastMessage: parsedMessage.body.text,
      lastMessageId: message.id,
      ...(contact != null && {
        customer: {
          displayPhoneNumber: to,
          avatar: contact.avatar || '',
          name: contact.name || '',
          contact: {
            id: contact.id
          }
        }
      })
    },
    { merge: true }
  );

  await getMessageRef(uid, to, message.id).set({
    id: message.id,
    type: 'template',
    body: parsedMessage.body.text,
    status: message.message_status,
    ...(template != null && {
      template: {
        name: template.name
      }
    }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    sender: 'business',
    receiver: 'customer'
  });
}
