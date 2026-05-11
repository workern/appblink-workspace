import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../data-utils';

// Create Flow
export const createFlow = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    name: z.string().nonempty(),
    categories: z.array(z.string()).nonempty(),
    clone_flow_id: z.string().optional(),
    endpoint_uri: z.string().optional()
  });
  await checkRequest(request, schema, true);
  const { wabaId, name, categories, clone_flow_id, endpoint_uri } =
    request.data;
  const form: any = { name, categories };
  if (clone_flow_id) form.clone_flow_id = clone_flow_id;
  if (endpoint_uri) form.endpoint_uri = endpoint_uri;
  const res = await graphApiRequest('post', `${wabaId}/flows`, form);
  return res.data;
});

// Migrate Flows
export const migrateFlows = onCall(async (request) => {
  const schema = z.object({
    wabaId: z.string().nonempty(),
    source_waba_id: z.string().nonempty(),
    source_flow_names: z.array(z.string()).optional()
  });
  await checkRequest(request, schema, true);
  const { wabaId, source_waba_id, source_flow_names } = request.data;
  const form: any = { source_waba_id };
  if (source_flow_names) form.source_flow_names = source_flow_names;
  const res = await graphApiRequest('post', `${wabaId}/migrate_flows`, form);
  return res.data;
});

// Get Flow
export const getFlow = onCall(async (request) => {
  const schema = z.object({
    flowId: z.string().nonempty(),
    fields: z.string().optional()
  });
  await checkRequest(request, schema, true);
  const { flowId, fields } = request.data;
  const params = fields ? { fields } : {};
  const res = await graphApiRequest('get', `${flowId}`, {}, params);
  return res.data;
});

// Get Preview URL
export const getFlowPreview = onCall(async (request) => {
  const schema = z.object({
    flowId: z.string().nonempty(),
    invalidate: z.boolean().optional()
  });
  await checkRequest(request, schema, true);
  const { flowId, invalidate } = request.data;
  const fields = `preview.invalidate(${invalidate ? 'true' : 'false'})`;
  const res = await graphApiRequest('get', `${flowId}`, {}, { fields });
  return res.data;
});

// List Flows
export const listFlows = onCall(async (request) => {
  const schema = z.object({ wabaId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { wabaId } = request.data;
  const res = await graphApiRequest('get', `${wabaId}/flows`);
  return res.data;
});

// Update Flow: Upload JSON Asset
export const uploadFlowJson = onCall(async (request) => {
  const schema = z.object({
    flowId: z.string().nonempty(),
    file: z.any(),
    name: z.string(),
    asset_type: z.literal('FLOW_JSON')
  });
  await checkRequest(request, schema, true);
  const { flowId, file, name, asset_type } = request.data;
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  form.append('asset_type', asset_type);
  const res = await graphApiRequest('post', `${flowId}/assets`, form);
  return res.data;
});

// Publish Flow
export const publishFlow = onCall(async (request) => {
  const schema = z.object({ flowId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { flowId } = request.data;
  const res = await graphApiRequest('post', `${flowId}/publish`);
  return res.data;
});

// Update Flow Metadata
export const updateFlowMetadata = onCall(async (request) => {
  const schema = z.object({
    flowId: z.string().nonempty(),
    name: z.string().optional(),
    categories: z.array(z.string()).optional(),
    endpoint_uri: z.string().optional()
  });
  await checkRequest(request, schema, true);
  const { flowId, name, categories, endpoint_uri } = request.data;
  const form: any = {};
  if (name) form.name = name;
  if (categories) form.categories = categories;
  if (endpoint_uri) form.endpoint_uri = endpoint_uri;
  const res = await graphApiRequest('post', `${flowId}`, form);
  return res.data;
});

// List Assets
export const listFlowAssets = onCall(async (request) => {
  const schema = z.object({ flowId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { flowId } = request.data;
  const res = await graphApiRequest('get', `${flowId}/assets`);
  return res.data;
});

// Deprecate Flow
export const deprecateFlow = onCall(async (request) => {
  const schema = z.object({ flowId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { flowId } = request.data;
  const res = await graphApiRequest('post', `${flowId}/deprecate`);
  return res.data;
});

// Delete Flow
export const deleteFlow = onCall(async (request) => {
  const schema = z.object({ flowId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { flowId } = request.data;
  const res = await graphApiRequest('delete', `${flowId}`);
  return res.data;
});

// Setup Endpoint Encryption
export const setEncryptionKey = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    business_public_key: z.string().nonempty()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, business_public_key } = request.data;
  const form = { business_public_key };
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/whatsapp_business_encryption`,
    form
  );
  return res.data;
});

export const getEncryptionKey = onCall(async (request) => {
  const schema = z.object({ phoneNumberId: z.string().nonempty() });
  await checkRequest(request, schema, true);
  const { phoneNumberId } = request.data;
  const res = await graphApiRequest(
    'get',
    `${phoneNumberId}/whatsapp_business_encryption`
  );
  return res.data;
});

// Send Flow Messages
async function sendInteractiveMessage(phoneNumberId, payload) {
  return graphApiRequest('post', `${phoneNumberId}/messages`, payload);
}

export const sendDraftFlowByName = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    to: z.string().nonempty(),
    flow_name: z.string().nonempty(),
    flow_token: z.string().nonempty(),
    screen: z.string().nonempty(),
    data: z.record(z.any()).optional()
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, to, flow_name, flow_token, screen, data } =
    request.data;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'flow',
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_action: 'navigate',
          flow_token,
          flow_name,
          mode: 'draft',
          flow_action_payload: { screen, data: data || {} }
        }
      }
    }
  };
  const res = await sendInteractiveMessage(phoneNumberId, payload);
  return res.data;
});

// (similarly implement sendDraftFlowById, sendPublishedFlowByName, sendPublishedFlowById...)

// Get Endpoint Metrics
export const getFlowMetric = onCall(async (request) => {
  const schema = z.object({
    flowId: z.string().nonempty(),
    metricName: z.string().nonempty(),
    granularity: z.string().nonempty(),
    since: z.string().optional(),
    until: z.string().optional()
  });
  await checkRequest(request, schema, true);
  const { flowId, metricName, granularity, since, until } = request.data;
  let fields = `metric.name(${metricName}).granularity(${granularity})`;
  if (since) fields += `.since(${since})`;
  if (until) fields += `.until(${until})`;
  const res = await graphApiRequest('get', `${flowId}`, {}, { fields });
  return res.data;
});

// End of Flow Management Functions
