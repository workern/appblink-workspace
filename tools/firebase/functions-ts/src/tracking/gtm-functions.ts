import { onRequest } from 'firebase-functions/v2/https';
import { db, deployOptions, admin, GOOGLE_ADS_DEVELOPER_TOKEN, projectID } from '../global';
import * as z from 'zod';
import { logger } from 'firebase-functions';
import { google } from 'googleapis';
import axios from 'axios';
import { requireAuth, requireMethod, parseBody } from '../utils/request.utils';

// Scopes required for Tag Manager and Analytics Admin
const GTM_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/tagmanager.manage.accounts'
];
const ANALYTICS_SCOPES = [
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/analytics'
];

async function getGtmClient() {
  const auth = await google.auth.getClient({ scopes: GTM_SCOPES });
  return google.tagmanager({ version: 'v2', auth });
}

async function getAnalyticsAdminClient() {
  const auth = await google.auth.getClient({ scopes: ANALYTICS_SCOPES });
  return google.analyticsadmin({ version: 'v1alpha', auth });
}

// Validation schemas
const initializeGTMSchema = z.object({
  appName: z.string().min(1).max(100),
  containerType: z.enum(['web', 'mobile', 'server']).optional().default('web'),
  accountId: z.string().optional(),
  workspaceId: z.string().optional(),
  spaceId: z.string().optional()
});

const configureAnalyticsSchema = z.object({
  containerId: z.string().startsWith('GTM-'),
  ga4MeasurementId: z.string().optional(),
  googleAdsCustomerId: z.string().optional(),
  conversionLabels: z.record(z.string(), z.string()).optional(),
  scannedEvents: z.array(z.string()).optional(),
  workspaceId: z.string().optional(),
  spaceId: z.string().optional()
});

const generateLabelsSchema = z.object({
  appName: z.string().min(1),
  appDescription: z.string().min(10),
  keyConversionEvents: z.array(z.string()).min(1)
});

// Helper for Google Ads category mapping
function toGoogleAdsCategory(category: string): string {
  const map: Record<string, string> = {
    PURCHASE: 'PURCHASE',
    SIGN_UP: 'SIGN_UP',
    LEAD: 'LEAD',
    ENGAGEMENT: 'ENGAGEMENT',
    ADD_TO_CART: 'ADD_TO_CART',
    OTHER: 'OTHER',
    purchase: 'PURCHASE',
    sign_up: 'SIGN_UP',
    lead: 'LEAD',
    engagement: 'ENGAGEMENT',
    add_to_cart: 'ADD_TO_CART',
    contact: 'LEAD',
    other: 'OTHER'
  };
  return map[category] ?? 'OTHER';
}

// ─── Setup Action Handlers ───────────────────────────────────────────────────

async function handleInitializeGtm(req: any, res: any, uid: string) {
  const validated = parseBody(
    initializeGTMSchema,
    req.body,
    res,
    'Invalid GTM setup data'
  );
  if (validated === undefined) return;

  const gtm = await getGtmClient();

  let accountId = validated.accountId;
  if (!accountId) {
    const accountsRes = await gtm.accounts.list();
    const accounts = accountsRes.data?.account || [];
    if (!accounts.length) {
      res.status(400).json({
        error: 'No Tag Manager accounts found for service account'
      });
      return;
    }
    accountId = accounts[0].accountId as string;
  }

  const containersRes = await gtm.accounts.containers.list({
    parent: `accounts/${accountId}`
  });
  const existingContainer = containersRes.data.container?.find(
    (c) => c.name === validated.appName
  );

  let container: any;
  let reused = false;
  if (existingContainer) {
    logger.info(
      `Using existing GTM container: ${validated.appName} (${existingContainer.publicId})`
    );
    container = existingContainer;
    reused = true;
  } else {
    logger.info(
      `Creating GTM container: ${validated.appName} for account: ${accountId}`
    );
    const containerRes = await gtm.accounts.containers.create({
      parent: `accounts/${accountId}`,
      requestBody: {
        name: validated.appName,
        usageContext: [validated.containerType === 'web' ? 'web' : 'mobile']
      }
    });
    container = containerRes.data;
  }

  const publicId =
    (container.publicId as string) ||
    `GTM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const containerId =
    (container.containerId as string) || container.publicId || publicId;

  const workspacesRes = await gtm.accounts.containers.workspaces.list({
    parent: `accounts/${accountId}/containers/${containerId}`
  });
  const workspaces = workspacesRes.data.workspace || [];
  const existingWorkspace = workspaces.find(w => w.name === 'App Blink Workspace');

  let workspace: any;
  const createdTriggers: string[] = [];
  const existingTriggers: string[] = [];

  if (existingWorkspace) {
    logger.info(`Using existing GTM workspace: App Blink Workspace`);
    workspace = existingWorkspace;
    
    try {
      const trigsRes = await gtm.accounts.containers.workspaces.triggers.list({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspace.workspaceId}`
      });
      const trigs = trigsRes.data.trigger || [];
      trigs.forEach(t => {
        if (t.name) existingTriggers.push(t.name);
      });
    } catch (trigListErr) {
      console.warn('Failed to list existing triggers', trigListErr);
    }
  } else {
    logger.info(`Creating GTM workspace: App Blink Workspace`);
    const workspaceRes = await gtm.accounts.containers.workspaces.create({
      parent: `accounts/${accountId}/containers/${containerId}`,
      requestBody: {
        name: 'App Blink Workspace',
        description: 'Workspace automatically managed by App Blink IDE extension.'
      }
    });
    workspace = workspaceRes.data;
  }

  const workspaceId = workspace.workspaceId as string;

  // Initialize standard event triggers (re-using existing triggers if names match)
  const defaultEvents = ['sign_in_complete', 'sign_up_complete', 'purchase_completed'];
  for (const eventName of defaultEvents) {
    if (existingTriggers.includes(eventName)) {
      logger.info(`Trigger already present, skipping: ${eventName}`);
      createdTriggers.push(eventName);
      continue;
    }

    try {
      const triggerRes = await gtm.accounts.containers.workspaces.triggers.create({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
        requestBody: {
          name: eventName,
          type: 'customEvent',
          eventName: {
            type: 'template',
            value: eventName
          }
        }
      });
      if (triggerRes.data?.name) {
        createdTriggers.push(triggerRes.data.name as string);
      }
    } catch (err) {
      console.warn('Failed to create trigger', eventName, err);
    }
  }

  let publishedVersion = 1;
  try {
    const versionRes: any =
      await gtm.accounts.containers.workspaces.create_version({
        path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
        requestBody: {
          name: 'App Blink Initializer',
          notes: 'Standard event triggers generated automatically by App Blink.'
        }
      });

    const version = versionRes.data;
    if (version.containerVersionId) {
      await gtm.accounts.containers.versions.publish({
        path: `accounts/${accountId}/containers/${containerId}/versions/${version.containerVersionId}`
      });
      publishedVersion =
        parseInt(version.containerVersionId, 10) || publishedVersion;
      console.log(`Published GTM version 1 for ${validated.appName}`);
    }
  } catch (pubErr) {
    console.warn('Workspace publishing failed', pubErr);
  }

  const docData = {
    appName: validated.appName,
    containerType: validated.containerType,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: uid,
    status: 'initialized',
    analyticsConfigured: false,
    adsConfigured: false,
    publishedVersion,
    lastPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
    triggers: createdTriggers,
    publicId,
    containerId,
    accountId
  };

  // 1. Global lookup collection under apps/app-blink/gtmContainers
  await db
    .collection('apps')
    .doc('app-blink')
    .collection('gtmContainers')
    .doc(publicId)
    .set(docData);

  // 2. Nested workspace space GTM collection
  if (validated.workspaceId && validated.spaceId) {
    await db
      .collection('apps')
      .doc('app-blink')
      .collection('workspaces')
      .doc(validated.workspaceId)
      .collection('spaces')
      .doc(validated.spaceId)
      .collection('gtmContainers')
      .doc(publicId)
      .set(docData);
  }

  res.json({
    success: true,
    containerId: publicId,
    reused,
    numericAccountId: accountId,
    numericContainerId: containerId,
    workspaceId: workspace.workspaceId || '2',
    appName: validated.appName,
    triggers: createdTriggers,
    publishedVersion,
    message: `GTM container created and published. Container ID: ${publicId}`
  });
}

async function discoverOrCreateGA4MeasurementId(appName: string): Promise<string | undefined> {
  try {
    const activeProjectId = projectID || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!activeProjectId) {
      logger.warn('[GA4 Discovery] No active project ID found in environment');
      return undefined;
    }

    logger.info(`[GA4 Discovery] Starting GA4 property/stream lookup for Firebase project: ${activeProjectId} (App: ${appName})`);

    const analyticsAdmin = await getAnalyticsAdminClient();
    const accountsRes = await analyticsAdmin.accounts.list();
    const accounts = accountsRes.data.accounts || [];

    if (accounts.length === 0) {
      logger.warn('[GA4 Discovery] No Google Analytics accounts found');
      return undefined;
    }

    // 1. Find or identify target property
    let targetProperty: any = null;

    for (const account of accounts) {
      try {
        const propertiesRes = await analyticsAdmin.properties.list({
          filter: `parent:${account.name}`
        });
        const properties = propertiesRes.data.properties || [];
        
        // Search by Project ID (Firebase Link indicator)
        targetProperty = properties.find(p => 
          p.displayName?.toLowerCase().includes(activeProjectId.toLowerCase())
        );

        if (!targetProperty) {
          // Search by App Name
          targetProperty = properties.find(p => 
            p.displayName?.toLowerCase().includes(appName.toLowerCase())
          );
        }

        if (!targetProperty && properties.length > 0) {
          // Fallback to the first property in account
          targetProperty = properties[0];
        }

        if (targetProperty) {
          logger.info(`[GA4 Discovery] Selected target GA4 property: ${targetProperty.displayName} (${targetProperty.name})`);
          break;
        }
      } catch (err: any) {
        logger.warn(`[GA4 Discovery] Failed to list properties for account ${account.name}:`, err.message);
      }
    }

    if (!targetProperty) {
      logger.warn('[GA4 Discovery] No matching GA4 properties found');
      return undefined;
    }

    // 2. Find or create Web Data Stream
    const streamsRes = await analyticsAdmin.properties.webDataStreams.list({
      parent: targetProperty.name
    });
    const webDataStreams = streamsRes.data.webDataStreams || [];
    const targetUrl = `https://${activeProjectId}.web.app`;

    let webStream = webDataStreams.find(s =>
      (s.defaultUri?.toLowerCase().includes(activeProjectId.toLowerCase()) ||
       s.displayName?.toLowerCase().includes(appName.toLowerCase()))
    );

    if (webStream && webStream.measurementId) {
      logger.info(`[GA4 Discovery] Found existing Web Data Stream: ${webStream.displayName} (${webStream.measurementId})`);
      return webStream.measurementId;
    }

    // Create a new Web Data Stream if none is found
    const streamName = `${appName} Web Stream`;
    logger.info(`[GA4 Discovery] Creating new Web Data Stream: "${streamName}" for URL: ${targetUrl}`);
    
    const createRes = await analyticsAdmin.properties.webDataStreams.create({
      parent: targetProperty.name,
      requestBody: {
        displayName: streamName,
        defaultUri: targetUrl
      }
    }) as any;

    const newStream = createRes.data;
    if (newStream && newStream.measurementId) {
      logger.info(`[GA4 Discovery] Created stream successfully: ${newStream.measurementId}`);
      return newStream.measurementId;
    }
  } catch (error: any) {
    logger.error('[GA4 Discovery] Error during GA4 stream auto-discovery/creation:', error.message || error);
  }
  return undefined;
}

async function handleConfigureAnalyticsTags(req: any, res: any, uid: string) {
  const validated = parseBody(
    configureAnalyticsSchema,
    req.body,
    res,
    'Invalid analytics configuration'
  );
  if (validated === undefined) return;

  const cleanTriggerName = (name: string) => name.replace(/[^a-zA-Z0-9_ -]/g, '_');

  const gtm = await getGtmClient();

  let containerDoc = await admin
    .firestore()
    .collection('apps')
    .doc('app-blink')
    .collection('gtmContainers')
    .doc(validated.containerId)
    .get();

  if (!containerDoc.exists && validated.workspaceId && validated.spaceId) {
    containerDoc = await admin
      .firestore()
      .collection('apps')
      .doc('app-blink')
      .collection('workspaces')
      .doc(validated.workspaceId)
      .collection('spaces')
      .doc(validated.spaceId)
      .collection('gtmContainers')
      .doc(validated.containerId)
      .get();
  }

  if (!containerDoc.exists) {
    res.status(404).json({ error: 'Container metadata not found in Firestore' });
    return;
  }

  const meta = containerDoc.data() as any;
  const accountId = meta.accountId as string;
  const containerId = meta.containerId as string;
  logger.info(
    `Configuring analytics for container: ${containerId} (Account: ${accountId})`
  );

  // Reuse the existing 'App Blink Workspace' if present, otherwise create it once.
  // Creating a new workspace every time means it gets destroyed on publish, leaving
  // listContainerTags reading an empty default workspace.
  const workspacesRes = await gtm.accounts.containers.workspaces.list({
    parent: `accounts/${accountId}/containers/${containerId}`
  });
  const existingWorkspace = (workspacesRes.data.workspace || []).find(
    (w: any) => w.name === 'App Blink Workspace'
  );

  let workspaceId: string;
  if (existingWorkspace) {
    workspaceId = existingWorkspace.workspaceId as string;
    logger.info(`[GTM Configure] Reusing existing workspace: ${workspaceId}`);
  } else {
    const workspaceRes = await gtm.accounts.containers.workspaces.create({
      parent: `accounts/${accountId}/containers/${containerId}`,
      requestBody: {
        name: 'App Blink Workspace',
        description: 'Workspace automatically managed by App Blink IDE extension.'
      }
    });
    workspaceId = (workspaceRes.data as any).workspaceId as string;
    logger.info(`[GTM Configure] Created new workspace: ${workspaceId}`);
  }

  const tagsCreated: string[] = [];

  // Fetch both tags and existing triggers so we can verify and link them
  const [existingTagsRes, existingTriggersRes] = await Promise.all([
    gtm.accounts.containers.workspaces.tags.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    }),
    gtm.accounts.containers.workspaces.triggers.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    })
  ]);

  const existingTags = existingTagsRes.data;
  const existingTriggers = existingTriggersRes.data.trigger || [];

  // GA4 Auto-discovery/creation if measurement ID is omitted
  let ga4IdToUse = validated.ga4MeasurementId;
  if (!ga4IdToUse) {
    logger.info('[GTM Setup] GA4 Measurement ID not provided. Running auto-discovery...');
    ga4IdToUse = await discoverOrCreateGA4MeasurementId(meta.appName || 'App');
  }

  // GA4 Tag setup (Base Configuration)
  if (ga4IdToUse) {
    try {
      const existingGa4Tag = existingTags.tag?.find(
        (t) => t.name === 'GA4 Config'
      );

      if (existingGa4Tag) {
        logger.info(`Updating existing GA4 Config tag: ${existingGa4Tag.path}`);
        await gtm.accounts.containers.workspaces.tags.update({
          path: existingGa4Tag.path,
          requestBody: {
            ...existingGa4Tag,
            parameter: [
              { type: 'template', key: 'measurementId', value: ga4IdToUse }
            ]
          }
        });
        tagsCreated.push('GA4 Config (Updated)');
      } else {
        const tagRes = await gtm.accounts.containers.workspaces.tags.create({
          parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
          requestBody: {
            name: 'GA4 Config',
            type: 'gaawc',
            parameter: [
              { type: 'template', key: 'measurementId', value: ga4IdToUse }
            ],
            firingTriggerId: []
          }
        });
        if (tagRes.data?.name) tagsCreated.push(tagRes.data.name as string);
      }
    } catch (err) {
      console.warn('Failed to create or update GA4 tag', err);
    }
  }

  // Create GTM triggers and GA4 Event Tags for all scanned events
  const eventsToCreateTriggersFor = new Set<string>();
  if (validated.scannedEvents) {
    validated.scannedEvents.forEach((e: string) => eventsToCreateTriggersFor.add(e));
  }
  if (validated.conversionLabels) {
    Object.keys(validated.conversionLabels).forEach((e: string) => eventsToCreateTriggersFor.add(e));
  }

  for (const eventName of eventsToCreateTriggersFor) {
    try {
      const triggerName = cleanTriggerName(eventName);
      let trigger = existingTriggers.find((t: any) => t.name === triggerName);
      if (!trigger) {
        logger.info(`Creating GTM Custom Event Trigger: ${triggerName} for event: ${eventName}`);
        const triggerRes = await gtm.accounts.containers.workspaces.triggers.create({
          parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
          requestBody: {
            name: triggerName,
            type: 'customEvent',
            eventName: {
              type: 'template',
              value: eventName
            }
          }
        });
        trigger = triggerRes.data;
        existingTriggers.push(trigger);
        tagsCreated.push(`Trigger: ${triggerName}`);
      }

      // Automatically create a GA4 Event Tag for this trigger if GA4 Config exists
      if (ga4IdToUse) {
        const ga4EventTagName = `GA4 Event - ${triggerName}`;
        const existingGa4EventTag = existingTags.tag?.find(
          (t: any) => t.name === ga4EventTagName
        );
        if (!existingGa4EventTag) {
          logger.info(`Creating GA4 Event Tag: ${ga4EventTagName} for event: ${eventName}`);
          const triggerId = trigger.triggerId as string;
          const tagRes = await gtm.accounts.containers.workspaces.tags.create({
            parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
            requestBody: {
              name: ga4EventTagName,
              type: 'gaawe',
              parameter: [
                { type: 'tag_reference', key: 'measurementId', value: 'GA4 Config' },
                { type: 'template', key: 'eventName', value: eventName }
              ],
              firingTriggerId: [triggerId],
              setupTag: [
                {
                  tagName: 'GA4 Config',
                  stopOnSetupFailure: true
                }
              ]
            }
          });
          if (tagRes.data?.name) {
            tagsCreated.push(tagRes.data.name as string);
          }
        }
      }
    } catch (err: any) {
      console.warn(`Failed to create custom event trigger or GA4 Event tag for: ${eventName}`, err.message || err);
    }
  }

  // Google Ads Tag setup
  if (validated.googleAdsCustomerId && validated.conversionLabels) {
    const cleanAdsId = validated.googleAdsCustomerId.replace(/-/g, '');
    for (const [eventName, labelInfo] of Object.entries(validated.conversionLabels)) {
      try {
        const label =
          typeof labelInfo === 'string'
            ? labelInfo
            : (labelInfo as any).label;

        // Find the Custom Event Trigger (should be already created in step above!)
        const triggerName = cleanTriggerName(eventName);
        let trigger = existingTriggers.find((t) => t.name === triggerName);
        if (!trigger) {
          logger.info(`Fallback: Creating Custom Event Trigger for event: ${eventName}`);
          const triggerRes = await gtm.accounts.containers.workspaces.triggers.create({
            parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
            requestBody: {
              name: triggerName,
              type: 'customEvent',
              eventName: {
                type: 'template',
                value: eventName
              }
            }
          });
          trigger = triggerRes.data;
          existingTriggers.push(trigger);
        }
        const triggerId = trigger.triggerId as string;

        const tagName = `Ads Conversion - ${cleanTriggerName(eventName)}`;
        const existingAdsTag = existingTags.tag?.find(
          (t) => t.name === tagName
        );

        if (existingAdsTag) {
          logger.info(`Updating existing Google Ads tag: ${tagName}`);
          await gtm.accounts.containers.workspaces.tags.update({
            path: existingAdsTag.path,
            requestBody: {
              ...existingAdsTag,
              parameter: [
                { type: 'template', key: 'conversionId', value: cleanAdsId },
                { type: 'template', key: 'conversionLabel', value: label }
              ],
              firingTriggerId: [triggerId]
            }
          });
          tagsCreated.push(`${tagName} (Updated)`);
        } else {
          const tagRes = await gtm.accounts.containers.workspaces.tags.create({
            parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
            requestBody: {
              name: tagName,
              type: 'awct',
              parameter: [
                { type: 'template', key: 'conversionId', value: cleanAdsId },
                { type: 'template', key: 'conversionLabel', value: label }
              ],
              firingTriggerId: [triggerId]
            }
          });
          if (tagRes.data?.name) tagsCreated.push(tagRes.data.name as string);
        }
      } catch (err) {
        console.warn('Failed to create or update Ads conversion tag', eventName, err);
      }
    }
  }

  const updateData = {
    analyticsConfigured: !!ga4IdToUse,
    adsConfigured: !!(
      validated.googleAdsCustomerId && validated.conversionLabels
    ),
    ga4MeasurementId: ga4IdToUse || null,
    googleAdsCustomerId: validated.googleAdsCustomerId || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: uid
  };

  await admin
    .firestore()
    .collection('apps')
    .doc('app-blink')
    .collection('gtmContainers')
    .doc(validated.containerId)
    .update(updateData);

  const workspaceIdToUse = validated.workspaceId || meta.workspaceId;
  const spaceIdToUse = validated.spaceId || meta.spaceId;
  if (workspaceIdToUse && spaceIdToUse) {
    const ref = admin
      .firestore()
      .collection('apps')
      .doc('app-blink')
      .collection('workspaces')
      .doc(workspaceIdToUse)
      .collection('spaces')
      .doc(spaceIdToUse)
      .collection('gtmContainers')
      .doc(validated.containerId);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update(updateData);
    } else {
      await ref.set({
        ...meta,
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  let versionNumber = (meta.publishedVersion || 1) + 1;
  try {
    const versionRes: any =
      await gtm.accounts.containers.workspaces.create_version({
        path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
        requestBody: {
          name: `Analytics Setup v${versionNumber}`,
          notes: `Configured GA4 (${ga4IdToUse || 'None'}) and Google Ads conversions.`
        }
      });

    const version = versionRes.data;
    if (version.containerVersionId) {
      await gtm.accounts.containers.versions.publish({
        path: `accounts/${accountId}/containers/${containerId}/versions/${version.containerVersionId}`
      });
      versionNumber =
        parseInt(version.containerVersionId, 10) || versionNumber;
    }
  } catch (pubErr) {
    console.warn('Workspace publishing failed', pubErr);
  }

  const publishUpdate = {
    publishedVersion: versionNumber,
    lastPublishedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await admin
    .firestore()
    .collection('apps')
    .doc('app-blink')
    .collection('gtmContainers')
    .doc(validated.containerId)
    .update(publishUpdate);

  if (workspaceIdToUse && spaceIdToUse) {
    await admin
      .firestore()
      .collection('apps')
      .doc('app-blink')
      .collection('workspaces')
      .doc(workspaceIdToUse)
      .collection('spaces')
      .doc(spaceIdToUse)
      .collection('gtmContainers')
      .doc(validated.containerId)
      .update(publishUpdate);
  }

  res.json({
    success: true,
    containerId: validated.containerId,
    tagsCreated,
    publishedVersion: versionNumber,
    ga4MeasurementId: ga4IdToUse,
    message: `Analytics configured and ready for publishing. Version: ${versionNumber}`
  });
}

// ─── Info Action Handlers ────────────────────────────────────────────────────

async function handleGetGtmContainerStatus(req: any, res: any, uid: string) {
  const containerId = (req.body?.containerId || req.query['containerId']) as string;
  if (!containerId) {
    res.status(400).json({ error: 'containerId is required' });
    return;
  }

  const workspaceId = (req.body?.workspaceId || req.query['workspaceId']) as string | undefined;
  const spaceId = (req.body?.spaceId || req.query['spaceId']) as string | undefined;

  let containerDoc = await admin
    .firestore()
    .collection('apps')
    .doc('app-blink')
    .collection('gtmContainers')
    .doc(containerId)
    .get();

  if (!containerDoc.exists && workspaceId && spaceId) {
    containerDoc = await admin
      .firestore()
      .collection('apps')
      .doc('app-blink')
      .collection('workspaces')
      .doc(workspaceId)
      .collection('spaces')
      .doc(spaceId)
      .collection('gtmContainers')
      .doc(containerId)
      .get();
  }

  if (!containerDoc.exists) {
    res.status(404).json({ error: 'Container not found' });
    return;
  }

  res.json({
    success: true,
    container: containerDoc.data()
  });
}

async function handleListGtmResources(req: any, res: any, uid: string) {
  const gtm = await getGtmClient();
  const accountsRes = await gtm.accounts.list();
  const accounts = accountsRes.data.account || [];

  const results = [];
  for (const acct of accounts) {
    const containersRes = await gtm.accounts.containers.list({
      parent: `accounts/${acct.accountId}`
    });
    results.push({
      account: acct,
      containers: containersRes.data.container || []
    });
  }

  res.json({
    success: true,
    accounts: results
  });
}

async function handleListContainerTags(req: any, res: any, uid: string) {
  const { accountId, containerId } = req.body;
  if (!accountId || !containerId) {
    res.status(400).json({ error: 'accountId and containerId are required' });
    return;
  }

  const gtm = await getGtmClient();

  const workspacesRes = await gtm.accounts.containers.workspaces.list({
    parent: `accounts/${accountId}/containers/${containerId}`
  });
  const workspaces = workspacesRes.data.workspace || [];
  if (!workspaces.length) {
    res.status(404).json({ error: 'No workspaces found in container' });
    return;
  }

  const workspaceId = workspaces[0].workspaceId;

  const [tagsRes, triggersRes] = await Promise.all([
    gtm.accounts.containers.workspaces.tags.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    }),
    gtm.accounts.containers.workspaces.triggers.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    })
  ]);

  const tags = tagsRes.data.tag || [];
  const triggers = triggersRes.data.trigger || [];

  const relevantTags = tags
    .filter((t) => t.type === 'gaawc' || t.type === 'awct' || t.type === 'gaawe')
    .map((t) => ({
      name: t.name,
      type: t.type,
      tagId: t.tagId,
      parameters: t.parameter?.reduce(
        (acc, p) => {
          if (p.key && p.value) acc[p.key] = p.value;
          return acc;
        },
        {} as Record<string, string>
      )
    }));

  const formattedTriggers = triggers.map((t) => ({
    name: t.name,
    triggerId: t.triggerId,
    type: t.type
  }));

  res.json({
    success: true,
    tags: relevantTags,
    triggers: formattedTriggers,
    workspaceId
  });
}

async function handleGetContainerDetails(req: any, res: any, uid: string) {
  const { accountId, containerId } = req.body;
  if (!accountId || !containerId) {
    res.status(400).json({ error: 'accountId and containerId are required' });
    return;
  }

  const gtm = await getGtmClient();

  const workspacesRes = await gtm.accounts.containers.workspaces.list({
    parent: `accounts/${accountId}/containers/${containerId}`
  });
  const workspaceId = workspacesRes.data.workspace?.[0]?.workspaceId;

  if (!workspaceId) throw new Error('No workspace found');

  const [tagsRes, triggersRes] = await Promise.all([
    gtm.accounts.containers.workspaces.tags.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    }),
    gtm.accounts.containers.workspaces.triggers.list({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
    })
  ]);

  res.json({
    success: true,
    tags: tagsRes.data.tag || [],
    triggers: triggersRes.data.trigger || []
  });
}

// ─── Ads Action Handlers ─────────────────────────────────────────────────────

async function handleCreateGoogleAdsConversions(req: any, res: any, uid: string) {
  const { customerId, conversions } = req.body;
  if (!customerId || !conversions || !Array.isArray(conversions)) {
    res.status(400).json({ error: 'customerId and conversions array are required' });
    return;
  }

  const devToken = GOOGLE_ADS_DEVELOPER_TOKEN.value();
  if (!devToken) {
    res.status(500).json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN secret is not configured' });
    return;
  }

  const cleanCustomerId = customerId.replace(/-/g, '');
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/adwords']
  });
  const accessToken = (await auth.getAccessToken()).token;

  const results = [];
  for (const conv of conversions) {
    try {
      const response = await axios.post(
        `https://googleads.googleapis.com/v17/customers/${cleanCustomerId}/conversionActions:mutate`,
        {
          operations: [
            {
              create: {
                name: conv.label,
                type: 'WEBPAGE',
                category: toGoogleAdsCategory(conv.category),
                status: 'ENABLED',
                viewThroughLookbackWindowDays: 30,
                primaryConfig: { primary: true }
              }
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': devToken,
            'login-customer-id': cleanCustomerId
          }
        }
      );

      const mutateResult = response.data.results[0];
      const resourceName = mutateResult.resourceName;

      const getResponse = await axios.get(
        `https://googleads.googleapis.com/v17/${resourceName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': devToken
          }
        }
      );

      results.push({
        eventName: conv.eventName,
        label: conv.label,
        tagLabel: getResponse.data.tagId
          ? `${conv.label} (GAds)`
          : getResponse.data.tagConfig?.conversionLabel,
        conversionId: cleanCustomerId,
        conversionLabel: getResponse.data.tagConfig?.conversionLabel
      });
    } catch (err: any) {
      logger.error(
        `Failed to create conversion: ${conv.label}`,
        err.response?.data || err.message
      );
    }
  }

  res.json({
    success: true,
    results
  });
}

async function handleGetAdsPerformance(req: any, res: any, uid: string) {
  const { customerId, days = 30 } = req.body;
  if (!customerId) {
    res.status(400).json({ error: 'customerId is required' });
    return;
  }

  const devToken = GOOGLE_ADS_DEVELOPER_TOKEN.value();
  const cleanCustomerId = customerId.replace(/-/g, '');
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/adwords']
  });
  const accessToken = (await auth.getAccessToken()).token;

  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date DURING LAST_${days}_DAYS
    ORDER BY metrics.impressions DESC
  `;

  const response = await axios.post(
    `https://googleads.googleapis.com/v17/customers/${cleanCustomerId}/googleAds:search`,
    { query },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': devToken,
        'login-customer-id': cleanCustomerId
      }
    }
  );

  const campaigns =
    response.data.results?.map((r: any) => ({
      name: r.campaign.name,
      status: r.campaign.status,
      impressions: parseInt(r.metrics.impressions) || 0,
      clicks: parseInt(r.metrics.clicks) || 0,
      conversions: parseFloat(r.metrics.conversions) || 0,
      cost: (parseInt(r.metrics.costMicros) || 0) / 1000000,
      value: parseFloat(r.metrics.conversionsValue) || 0
    })) || [];

  const totals = campaigns.reduce(
    (acc: any, curr: any) => {
      acc.impressions += curr.impressions;
      acc.clicks += curr.clicks;
      acc.conversions += curr.conversions;
      acc.cost += curr.cost;
      acc.value += curr.value;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, cost: 0, value: 0 }
  );

  res.json({
    success: true,
    campaigns,
    totals,
    currency: 'USD'
  });
}

async function handleListGoogleAdsAccounts(req: any, res: any, uid: string) {
  const { customerId } = req.body;
  if (!customerId) {
    res.status(400).json({ error: 'customerId (MCC ID) is required' });
    return;
  }

  const devToken = GOOGLE_ADS_DEVELOPER_TOKEN.value();
  const cleanCustomerId = customerId.replace(/-/g, '');
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/adwords']
  });
  const accessToken = (await auth.getAccessToken()).token;

  const query = `
    SELECT
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.id
    FROM customer_client
    WHERE customer_client.level <= 1 AND customer_client.status = 'ENABLED'
  `;

  const response = await axios.post(
    `https://googleads.googleapis.com/v17/customers/${cleanCustomerId}/googleAds:search`,
    { query },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': devToken,
        'login-customer-id': cleanCustomerId
      }
    }
  );

  const accounts =
    response.data.results?.map((r: any) => ({
      id: r.customerClient.id,
      name: r.customerClient.descriptiveName,
      resourceName: r.customerClient.clientCustomer
    })) || [];

  res.json({
    success: true,
    accounts
  });
}

// ─── Tracking Action Handlers ────────────────────────────────────────────────

async function handleGenerateConversionLabels(req: any, res: any, uid: string) {
  const validated = parseBody(
    generateLabelsSchema,
    req.body,
    res,
    'Invalid label generation data'
  );
  if (validated === undefined) return;

  const mockLabels = {
    sign_in_complete: {
      label: `${validated.appName} - User Sign In Completed`,
      category: 'ENGAGEMENT',
      valueType: 'standard'
    },
    sign_up_complete: {
      label: `${validated.appName} - User Sign Up Completed`,
      category: 'SIGN_UP',
      valueType: 'standard'
    },
    purchase_completed: {
      label: `${validated.appName} - Purchase Completed`,
      category: 'PURCHASE',
      valueType: 'dynamic'
    }
  };

  res.json({
    success: true,
    labels: mockLabels,
    message: 'Conversion action definitions generated.'
  });
}

async function handleDiscoverTrackingIds(req: any, res: any, uid: string) {
  const gtm = await getGtmClient();
  const accountsRes = await gtm.accounts.list();
  const accounts = accountsRes.data.account || [];

  const ga4Ids = new Set<string>();
  const adsIds = new Set<string>();
  const seenTags: any[] = [];

  for (const account of accounts) {
    const containersRes = await gtm.accounts.containers.list({
      parent: `accounts/${account.accountId}`
    });
    const containers = containersRes.data.container || [];

    for (const container of containers) {
      try {
        const workspacesRes = await gtm.accounts.containers.workspaces.list({
          parent: `accounts/${account.accountId}/containers/${container.containerId}`
        });
        const workspaces = workspacesRes.data.workspace || [];
        if (!workspaces.length) continue;

        const tagsRes = await gtm.accounts.containers.workspaces.tags.list({
          parent: `accounts/${account.accountId}/containers/${container.containerId}/workspaces/${workspaces[0].workspaceId}`
        });
        const tags = tagsRes.data.tag || [];

        for (const tag of tags) {
          const params: Record<string, string> =
            tag.parameter?.reduce(
              (acc, p) => {
                if (p.key && p.value) acc[p.key] = p.value;
                return acc;
              },
              {} as Record<string, string>
            ) || {};

          const isGa4 = tag.type === 'gaawc' || tag.type === 'googletag';
          const ga4Id = params['measurementId'] || params['tagId'];

          if (isGa4 && ga4Id) {
            ga4Ids.add(ga4Id);
            seenTags.push({
              id: ga4Id,
              name: tag.name,
              type: 'GA4',
              container: container.name
            });
          } else if (tag.type === 'awct' && params['conversionId']) {
            adsIds.add(params['conversionId']);
            seenTags.push({
              id: params['conversionId'],
              name: tag.name,
              type: 'Google Ads',
              container: container.name
            });
          }
        }
      } catch (e) {
        continue;
      }
    }
  }

  res.json({
    success: true,
    ga4Ids: Array.from(ga4Ids),
    adsIds: Array.from(adsIds).map((id) =>
      id.length === 10
        ? `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`
        : id
    ),
    details: seenTags
  });
}

// ─── Consolidated onRequest Exports ──────────────────────────────────────────

/**
 * Setup router: handles initialize and configure operations
 */
export const setup = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;
      const uid = await requireAuth(req, res, 'gtm-setup');
      if (uid === undefined) return;

      const action = req.body?.action;
      if (action === 'initialize') {
        await handleInitializeGtm(req, res, uid);
      } else if (action === 'configure') {
        await handleConfigureAnalyticsTags(req, res, uid);
      } else {
        res.status(400).json({ error: `Unknown setup action: ${action}` });
      }
    } catch (error: any) {
      logger.error('Error in gtm-setup:', error);
      res.status(500).json({
        error: error.message || 'Failed to execute setup action',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Info router: handles container status, tag/trigger listing, detailed info, and resources listing
 */
export const info = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST', 'GET')) return;
      const uid = await requireAuth(req, res, 'gtm-info');
      if (uid === undefined) return;

      const action = (req.method === 'POST' ? req.body?.action : req.query['action']) as string;
      if (action === 'status') {
        await handleGetGtmContainerStatus(req, res, uid);
      } else if (action === 'resources') {
        await handleListGtmResources(req, res, uid);
      } else if (action === 'tags') {
        await handleListContainerTags(req, res, uid);
      } else if (action === 'details') {
        await handleGetContainerDetails(req, res, uid);
      } else {
        res.status(400).json({ error: `Unknown info action: ${action}` });
      }
    } catch (error: any) {
      logger.error('Error in gtm-info:', error);
      res.status(500).json({
        error: error.message || 'Failed to execute info action',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Ads router: handles Google Ads conversions setup, campaign performance, and linked accounts listing
 */
export const ads = onRequest(
  { ...deployOptions, secrets: [GOOGLE_ADS_DEVELOPER_TOKEN], cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;
      const uid = await requireAuth(req, res, 'gtm-ads');
      if (uid === undefined) return;

      const action = req.body?.action;
      const platform = req.body?.platform || 'google-ads';

      if (platform !== 'google-ads') {
        res.status(400).json({ error: `Platform '${platform}' is not supported yet` });
        return;
      }

      if (action === 'create-conversions') {
        await handleCreateGoogleAdsConversions(req, res, uid);
      } else if (action === 'performance') {
        await handleGetAdsPerformance(req, res, uid);
      } else if (action === 'accounts') {
        await handleListGoogleAdsAccounts(req, res, uid);
      } else {
        res.status(400).json({ error: `Unknown ads action: ${action}` });
      }
    } catch (error: any) {
      logger.error('Error in gtm-ads:', error);
      res.status(500).json({
        error: error.message || 'Failed to execute ads action',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Tracking router: handles conversion labels generation (AI) and tracking IDs discovery
 */
export const tracking = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST', 'GET')) return;
      const uid = await requireAuth(req, res, 'gtm-tracking');
      if (uid === undefined) return;

      const action = (req.method === 'POST' ? req.body?.action : req.query['action']) as string;
      if (action === 'generate-labels') {
        await handleGenerateConversionLabels(req, res, uid);
      } else if (action === 'discover-ids') {
        await handleDiscoverTrackingIds(req, res, uid);
      } else {
        res.status(400).json({ error: `Unknown tracking action: ${action}` });
      }
    } catch (error: any) {
      logger.error('Error in gtm-tracking:', error);
      res.status(500).json({
        error: error.message || 'Failed to execute tracking action',
        details: error.response?.data || null
      });
    }
  }
);
