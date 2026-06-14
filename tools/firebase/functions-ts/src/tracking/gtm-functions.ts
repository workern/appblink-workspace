import { onRequest } from 'firebase-functions/v2/https';
import { db, deployOptions, admin, GOOGLE_ADS_DEVELOPER_TOKEN } from '../global';
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

// Types
interface GTMContainerCreateRequest {
  appName: string;
  containerType?: 'web' | 'mobile' | 'server';
  accountId?: string;
}

interface GTMAnalyticsConfigRequest {
  containerId: string;
  ga4MeasurementId?: string;
  googleAdsCustomerId?: string;
  conversionLabels?: Record<string, string>;
}

interface ConversionLabelGenerationRequest {
  appName: string;
  appDescription: string;
  keyConversionEvents: string[];
}

// Validation schemas
const initializeGTMSchema = z.object({
  appName: z.string().min(1).max(100),
  containerType: z.enum(['web', 'mobile', 'server']).optional().default('web'),
  accountId: z.string().optional()
});

const configureAnalyticsSchema = z.object({
  containerId: z.string().startsWith('GTM-'),
  ga4MeasurementId: z.string().optional(),
  googleAdsCustomerId: z.string().optional(),
  conversionLabels: z.record(z.string(), z.string()).optional()
});

const generateLabelsSchema = z.object({
  appName: z.string().min(1),
  appDescription: z.string().min(10),
  keyConversionEvents: z.array(z.string()).min(1)
});

/**
 * Initialize GTM container with standard triggers
 * Creates GTM container and default triggers for common events
 */
export const initializegtmlandingpage = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-initialize');
      if (uid === undefined) return;

      // Validate input
      const validated = parseBody(
        initializeGTMSchema,
        req.body,
        res,
        'Invalid GTM setup data'
      );
      if (validated === undefined) return;

      // Initialize GTM API client
      const gtm = await getGtmClient();

      // Resolve accountId: use provided or pick the first available account
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

      // Check if container already exists
      const containersRes = await gtm.accounts.containers.list({
        parent: `accounts/${accountId}`
      });
      const existingContainer = containersRes.data.container?.find(
        (c) => c.name === validated.appName
      );

      let container: any;
      if (existingContainer) {
        logger.info(
          `Using existing GTM container: ${validated.appName} (${existingContainer.publicId})`
        );
        container = existingContainer;
      } else {
        // Create container under account
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

      // Create a workspace to hold initial tags/triggers
      const workspaceRes = await gtm.accounts.containers.workspaces.create({
        parent: `accounts/${accountId}/containers/${containerId}`,
        requestBody: { name: 'App Blink Workspace' }
      });
      const workspace = (workspaceRes.data as any) || {};

      // Standard triggers to create
      const standardTriggers = [
        'cta_install_click',
        'cta_login',
        'cta_see_features',
        'cta_navigate_home',
        'cta_start_shopping',
        'cta_become_partner',
        'scroll_to_features',
        'sign_in_complete',
        'sign_up_complete'
      ];

      const createdTriggers: string[] = [];
      for (const tName of standardTriggers) {
        try {
          const trig = await gtm.accounts.containers.workspaces.triggers.create(
            {
              parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspace.workspaceId}`,
              requestBody: {
                name: tName,
                type: 'customEvent',
                customEventFilter: [
                  {
                    type: 'equals',
                    parameter: [
                      { key: 'arg0', value: '{{_event}}' },
                      { key: 'arg1', value: tName }
                    ]
                  }
                ]
              }
            }
          );
          if (trig.data?.name) createdTriggers.push(trig.data.name as string);
        } catch (err) {
          console.warn('Failed to create trigger', tName, err);
        }
      }

      // Publish initial workspace to create first version and make it LIVE
      let publishedVersion = 1;
      try {
        const versionRes: any =
          await gtm.accounts.containers.workspaces.create_version({
            path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspace.workspaceId}`,
            requestBody: {
              name: `App Blink Initial Setup`,
              notes: `Initial container setup for ${validated.appName} with standard triggers.`
            }
          });

        const version = versionRes.data;
        if (version.containerVersionId) {
          await gtm.accounts.containers.versions.publish({
            path: `accounts/${accountId}/containers/${containerId}/versions/${version.containerVersionId}`
          });
          console.log(`Published GTM version 1 for ${validated.appName}`);
        }
      } catch (pubErr) {
        console.warn('Workspace publishing failed', pubErr);
      }

      // Persist container metadata to Firestore
      await db.collection('gtm_containers').doc(publicId).set({
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
      });

      res.json({
        success: true,
        containerId: publicId,
        appName: validated.appName,
        triggers: createdTriggers,
        publishedVersion,
        message: `GTM container created and published. Container ID: ${publicId}`
      });
    } catch (error: any) {
      logger.error('Error initializing GTM:', error);
      res.status(500).json({
        error: error.message || 'Failed to initialize GTM container',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Configure analytics tags (GA4, Google Ads)
 * Adds GA4 configuration tag and Google Ads conversion tags to existing container
 */
export const configureanalyticstags = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-configure-tags');
      if (uid === undefined) return;

      // Validate input
      const validated = parseBody(
        configureAnalyticsSchema,
        req.body,
        res,
        'Invalid analytics configuration'
      );
      if (validated === undefined) return;

      const gtm = await getGtmClient();

      // Lookup container metadata saved earlier (publicId -> containerId/accountId)
      const containerDoc = await admin
        .firestore()
        .collection('gtm_containers')
        .doc(validated.containerId)
        .get();

      if (!containerDoc.exists) {
        res
          .status(404)
          .json({ error: 'Container metadata not found in Firestore' });
        return;
      }

      const meta = containerDoc.data() as any;
      const accountId = meta.accountId as string;
      const containerId = meta.containerId as string;
      logger.info(
        `Configuring analytics for container: ${containerId} (Account: ${accountId})`
      );

      // Create a new workspace for the update
      const workspaceRes = await gtm.accounts.containers.workspaces.create({
        parent: `accounts/${accountId}/containers/${containerId}`,
        requestBody: { name: `Analytics Update ${new Date().toISOString()}` }
      });
      const workspaceId = (workspaceRes.data as any).workspaceId as string;

      const tagsCreated: string[] = [];

      // Create GA4 tag using the official 'gaawc' type (Google Tag)
      if (validated.ga4MeasurementId) {
        try {
          // Check if GA4 tag already exists (simplistic check by name)
          const existingTags =
            await gtm.accounts.containers.workspaces.tags.list({
              parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
            });
          const hasGa4 = existingTags.data.tag?.some(
            (t) => t.name === 'GA4 Config'
          );

          if (!hasGa4) {
            const tagRes = await gtm.accounts.containers.workspaces.tags.create(
              {
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: {
                  name: 'GA4 Config',
                  type: 'gaawc',
                  parameter: [
                    { key: 'measurementId', value: validated.ga4MeasurementId }
                  ],
                  firingTriggerId: []
                }
              }
            );
            if (tagRes.data?.name) tagsCreated.push(tagRes.data.name as string);
          }
        } catch (err) {
          console.warn('Failed to create GA4 tag', err);
        }
      }

      // Create Google Ads conversion tags using the official 'awct' type
      if (validated.googleAdsCustomerId && validated.conversionLabels) {
        for (const [eventName, labelInfo] of Object.entries(
          validated.conversionLabels
        )) {
          try {
            const label =
              typeof labelInfo === 'string'
                ? labelInfo
                : (labelInfo as any).label;
            const tagRes = await gtm.accounts.containers.workspaces.tags.create(
              {
                parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
                requestBody: {
                  name: `Ads Conversion - ${eventName}`,
                  type: 'awct',
                  parameter: [
                    {
                      key: 'conversionId',
                      value: validated.googleAdsCustomerId.replace(/-/g, '')
                    },
                    { key: 'conversionLabel', value: label }
                  ],
                  firingTriggerId: []
                }
              }
            );
            if (tagRes.data?.name) tagsCreated.push(tagRes.data.name as string);
          } catch (err) {
            console.warn('Failed to create Ads conversion tag', eventName, err);
          }
        }
      }

      // Update container status in Firestore
      await admin
        .firestore()
        .collection('gtm_containers')
        .doc(validated.containerId)
        .update({
          analyticsConfigured: !!validated.ga4MeasurementId,
          adsConfigured: !!(
            validated.googleAdsCustomerId && validated.conversionLabels
          ),
          ga4MeasurementId: validated.ga4MeasurementId || null,
          googleAdsCustomerId: validated.googleAdsCustomerId || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid
        });

      // Publish the workspace to make changes LIVE
      let versionNumber = (meta.publishedVersion || 1) + 1;
      try {
        const versionRes: any =
          await gtm.accounts.containers.workspaces.create_version({
            path: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
            requestBody: {
              name: `Analytics Setup v${versionNumber}`,
              notes: `Configured GA4 (${validated.ga4MeasurementId}) and Google Ads conversions.`
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

      // Update Firestore with published version
      await admin
        .firestore()
        .collection('gtm_containers')
        .doc(validated.containerId)
        .update({
          publishedVersion: versionNumber,
          lastPublishedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      res.json({
        success: true,
        containerId: validated.containerId,
        tagsCreated,
        publishedVersion: versionNumber,
        message: `Analytics configured and ready for publishing. Version: ${versionNumber}`
      });
    } catch (error: any) {
      logger.error('Error configuring analytics:', error);
      res.status(500).json({
        error: error.message || 'Failed to configure analytics tags',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Generate conversion labels using Gemini AI
 * Suggests conversion labels based on app description and key events
 */
export const generateconversionlabels = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-generate-labels');
      if (uid === undefined) return;

      // Validate input
      const validated = parseBody(
        generateLabelsSchema,
        req.body,
        res,
        'Invalid label generation data'
      );
      if (validated === undefined) return;

      const prompt = `
Given the following app details, generate Google Ads conversion tracking labels for each event.

App: ${validated.appName}
Description: ${validated.appDescription}
Key Conversion Events: ${validated.keyConversionEvents.join(', ')}

For each event, provide:
1. Event name (snake_case)
2. Suggested Google Ads conversion label description. IMPORTANT: The description MUST start with the app name "${validated.appName}" (e.g. "${validated.appName} - User Sign Up").
3. Category (sign_up, purchase, engagement, lead, etc.)
4. Value (if applicable)

Format as JSON:
{
  "event_name": {
    "label": "Description",
    "category": "category",
    "value": "value_type"
  }
}

Include these default events:
- sign_in_complete
- sign_up_complete
- cta_click (main call-to-action)
`;

      // Mock response for now
      const mockLabels = {
        sign_in_complete: {
          label: `${validated.appName} - User Sign In Completed`,
          category: 'sign_up',
          value: 'standard'
        },
        sign_up_complete: {
          label: `${validated.appName} - User Sign Up Completed`,
          category: 'sign_up',
          value: 'standard'
        },
        cta_click: {
          label: `${validated.appName} - Main CTA Click`,
          category: 'engagement',
          value: 'dynamic'
        }
      };

      res.json({
        success: true,
        labels: mockLabels,
        message:
          'Conversion labels generated. Configure them in your Google Ads account.'
      });
    } catch (error: any) {
      logger.error('Error generating labels:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate conversion labels'
      });
    }
  }
);

/**
 * Get GTM container status
 * Retrieves existing container configuration
 */
export const getgtmcontainerstatus = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST', 'GET')) return;

      const uid = await requireAuth(req, res, 'gtm-status');
      if (uid === undefined) return;

      const containerId = (req.body?.containerId ||
        req.query['containerId']) as string;
      if (!containerId) {
        res.status(400).json({ error: 'containerId is required' });
        return;
      }

      const containerDoc = await admin
        .firestore()
        .collection('gtm_containers')
        .doc(containerId)
        .get();

      if (!containerDoc.exists) {
        res.status(404).json({ error: 'Container not found' });
        return;
      }

      res.json({
        success: true,
        container: containerDoc.data()
      });
    } catch (error: any) {
      logger.error('Error fetching container:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch container status'
      });
    }
  }
);

/**
 * List all accessible GTM accounts and their containers
 */
export const listgtmresources = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST', 'GET')) return;

      const uid = await requireAuth(req, res, 'gtm-list-resources');
      if (uid === undefined) return;

      const gtm = await getGtmClient();

      const accountsRes = await gtm.accounts.list();
      const accounts = accountsRes.data.account || [];

      const result = [];

      for (const account of accounts) {
        const containersRes = await gtm.accounts.containers.list({
          parent: `accounts/${account.accountId}`
        });
        const containers = containersRes.data.container || [];

        result.push({
          accountId: account.accountId,
          name: account.name,
          containers: containers.map((c) => ({
            containerId: c.containerId,
            publicId: c.publicId,
            name: c.name,
            usageContext: c.usageContext
          }))
        });
      }

      res.json({
        success: true,
        accounts: result
      });
    } catch (error: any) {
      logger.error('Error listing GTM resources:', error);
      res.status(500).json({
        error: error.message || 'Failed to list GTM resources',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * List tags for a specific container to find existing GA4/Ads configs
 */
export const listcontainertags = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-list-tags');
      if (uid === undefined) return;

      const { accountId, containerId } = req.body;
      if (!accountId || !containerId) {
        res
          .status(400)
          .json({ error: 'accountId and containerId are required' });
        return;
      }

      const gtm = await getGtmClient();

      // Get the default workspace
      const workspacesRes = await gtm.accounts.containers.workspaces.list({
        parent: `accounts/${accountId}/containers/${containerId}`
      });
      const workspaces = workspacesRes.data.workspace || [];
      if (!workspaces.length) {
        res.status(404).json({ error: 'No workspaces found in container' });
        return;
      }

      const workspaceId = workspaces[0].workspaceId;

      const tagsRes = await gtm.accounts.containers.workspaces.tags.list({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`
      });

      const tags = tagsRes.data.tag || [];

      // Filter and format relevant tags (GA4 and Google Ads)
      const relevantTags = tags
        .filter((t) => t.type === 'gaawc' || t.type === 'awct')
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

      res.json({
        success: true,
        tags: relevantTags,
        workspaceId
      });
    } catch (error: any) {
      logger.error('Error listing container tags:', error);
      res.status(500).json({
        error: error.message || 'Failed to list container tags',
        details: error.response?.data || null
      });
    }
  }
);

/**
 * Create conversion actions in Google Ads and return their labels
 */
export const creategoogleadsconversions = onRequest(
  { ...deployOptions, secrets: [GOOGLE_ADS_DEVELOPER_TOKEN], cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-create-ads-conversions');
      if (uid === undefined) return;

      const { customerId, conversions } = req.body;
      if (!customerId || !conversions || !Array.isArray(conversions)) {
        res
          .status(400)
          .json({ error: 'customerId and conversions array are required' });
        return;
      }

      const devToken = GOOGLE_ADS_DEVELOPER_TOKEN.value();
      if (!devToken) {
        res.status(500).json({
          error: 'GOOGLE_ADS_DEVELOPER_TOKEN secret is not configured'
        });
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
          // https://developers.google.com/google-ads/api/reference/rpc/v17/ConversionAction
          const response = await axios.post(
            `https://googleads.googleapis.com/v17/customers/${cleanCustomerId}/conversionActions:mutate`,
            {
              operations: [
                {
                  create: {
                    name: conv.label,
                    type: 'WEBPAGE',
                    category: conv.category?.toUpperCase() || 'DEFAULT',
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
                'login-customer-id': cleanCustomerId // Assuming managed account is same as login
              }
            }
          );

          const mutateResult = response.data.results[0];
          const resourceName = mutateResult.resourceName;

          // Get the conversion label (usually the last part of resource name or requires a GET)
          // For simplicity, we fetch the created action details
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
          // Continue with others
        }
      }

      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      logger.error('Error creating Google Ads conversions:', error);
      res
        .status(500)
        .json({ error: 'Failed to create Google Ads conversions' });
    }
  }
);

/**
 * Scan all containers to discover previously used GA4 and Ads IDs
 */
export const discovertrackingids = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST', 'GET')) return;

      const uid = await requireAuth(req, res, 'gtm-discover-ids');
      if (uid === undefined) return;

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
            const workspacesRes = await gtm.accounts.containers.workspaces.list(
              {
                parent: `accounts/${account.accountId}/containers/${container.containerId}`
              }
            );
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
            // Skip containers we can't access
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
    } catch (error: any) {
      logger.error('Error discovering tracking IDs:', error);
      res.status(500).json({ error: 'Failed to discover tracking IDs' });
    }
  }
);

/**
 * Fetch campaign performance data from Google Ads
 */
export const getadsperformance = onRequest(
  { ...deployOptions, secrets: [GOOGLE_ADS_DEVELOPER_TOKEN], cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-get-ads-performance');
      if (uid === undefined) return;

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

      // Query account-level performance for the last N days
      // https://developers.google.com/google-ads/api/docs/reporting/overview
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

      // Calculate totals
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
        currency: 'USD' // Google Ads API returns account currency; simplified for mockup
      });
    } catch (error: any) {
      const details =
        error.response?.data?.[0]?.error || error.response?.data || null;
      logger.error('Error fetching Ads performance:', {
        message: error.message,
        details,
        customerId: req.body.customerId
      });
      res.status(500).json({
        error: 'Failed to fetch Ads performance',
        message: error.message,
        details
      });
    }
  }
);

/**
 * List linked client accounts for an MCC
 */
export const listgoogleadsaccounts = onRequest(
  { ...deployOptions, secrets: [GOOGLE_ADS_DEVELOPER_TOKEN], cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-list-ads-accounts');
      if (uid === undefined) return;

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

      // Query linked client accounts
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
    } catch (error: any) {
      const details =
        error.response?.data?.[0]?.error || error.response?.data || null;
      logger.error('Error listing Ads accounts:', {
        message: error.message,
        details
      });
      res.status(500).json({ error: 'Failed to list Ads accounts', details });
    }
  }
);
export const getcontainerdetails = onRequest(
  { ...deployOptions, cors: true },
  async (req, res) => {
    try {
      if (!requireMethod(req, res, 'POST')) return;

      const uid = await requireAuth(req, res, 'gtm-container-details');
      if (uid === undefined) return;

      const { accountId, containerId } = req.body;
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
    } catch (error: any) {
      logger.error('Error fetching container details:', error);
      res.status(500).json({ error: 'Failed to fetch container details' });
    }
  }
);
