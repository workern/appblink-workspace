import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { checkRequest } from '../../utils';
import { z } from 'zod';
import { db } from '../../global';
import { FieldValue } from 'firebase-admin/firestore';
import { whatsappAccessToken } from './constants';
import { log } from 'firebase-functions/logger';
// --- Template Management Functions ---

// Get template by ID (default fields)
export const getTemplateById = onCall(async (request) => {
  const schema = z.object({ templateId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { templateId } = request.data;
  const res = await graphApiRequest('get', `${templateId}`);
  return res.data;
});

// Get template by name (default fields)
export const getTemplateByName = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    name: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { wabaId, name } = request.data;
  const res = await graphApiRequest(
    'get',
    `${wabaId}/message_templates`,
    {},
    { name }
  );
  return res.data;
});

// List all templates (default fields)
export const listTemplates = onCall(
  { secrets: [whatsappAccessToken] },
  async (request) => {
    const schema = z.object({ wabaId: z.string().nonempty() });
    await checkRequest(request, schema, true);
    const { wabaId } = request.data;
    const res = await graphApiRequest('get', `${wabaId}/message_templates`);
    return res.data;
  }
);

// Get namespace
export const getTemplateNamespace = onCall(async (request) => {
  const schema = z.object({ wabaId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${wabaId}`,
    {},
    { fields: 'message_template_namespace' }
  );
  return res.data;
});

// Create or update a message template
export const createOrUpdateTemplate = onCall(
  { secrets: [whatsappAccessToken] },
  async (request) => {
    const schema = z.object({
      wabaId: z.string().nonempty(),
      template: z.object({
        name: z.string().nonempty(),
        language: z.string().nonempty(),
        category: z.string().nonempty(),
        components: z.array(z.any()).nonempty()
      })
    });
    await checkRequest(request, schema, true);
    const uid = request.auth?.uid as string;
    const { wabaId, template } = request.data;

    const res = await graphApiRequest(
      'post',
      `${wabaId}/message_templates`,
      template
    );
    template.components = template.components.map((c) => {
      delete c.example;
      return c;
    });
    await db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc('messengerAppSpace')
      .collection('templates')
      .doc(template.name)
      .set({
        ...template,
        ...res.data,
        updatedAt: FieldValue.serverTimestamp()
      });
    return res.data;
  }
);

// Edit template by ID
export const editTemplate = onCall(async (request) => {
  const schema = z.object({
    templateId: z.string().nonempty(),
    template: z.object({
      name: z.string().optional(),
      language: z.string().optional(),
      category: z.string().optional(),
      components: z.array(z.any()).optional()
    })
  });
  await checkRequest(request, schema, true);
  const { templateId, template } = request.data;
  const res = await graphApiRequest('post', `${templateId}`, template);
  return res.data;
});

// Delete template by name
export const deleteTemplateByName = onCall(
  { secrets: [whatsappAccessToken] },
  async (request) => {
    const schema = z.object({
      wabaId: z.string().nonempty(),
      name: z.string().nonempty()
    });
    await checkRequest(request, schema, true);
    const { wabaId, name } = request.data;
    const res = await graphApiRequest(
      'delete',
      `${wabaId}/message_templates`,
      {},
      { name }
    );
    const uid = request.auth?.uid as string;
    await db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc('messengerAppSpace')
      .collection('templates')
      .doc(name)
      .delete();
    log('Template deleted:', name);
    return res.data;
  }
);

// Delete template by ID
export const deleteTemplateById = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    hsmId: z.string().nonempty(),
    name: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { wabaId, hsmId, name } = request.data;
  const res = await graphApiRequest(
    'delete',
    `${wabaId}/message_templates`,
    {},
    { hsm_id: hsmId, name }
  );
  return res.data;
});
