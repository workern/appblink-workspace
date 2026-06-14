/**
 * Attribution Link Tracking System
 *
 * Enterprise-grade link attribution tracking with:
 * - Bot detection using user-agent analysis
 * - IP-based deduplication with hashing for privacy
 * - Browser fingerprinting for enhanced deduplication
 * - Geographic tracking (country/city)
 * - Device type detection
 * - Real-time analytics
 */

import { onRequest } from 'firebase-functions/v2/https';
import { db, firestoreWriteTimestamp } from '../global';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

// Bot detection patterns (inspired by Google Analytics, Cloudflare, etc.)
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /java/i,
  /okhttp/i,
  /axios/i,
  /fetch/i,
  /lighthouse/i,
  /googlebot/i,
  /bingbot/i,
  /slackbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i
];

/**
 * Detect if request is from a bot
 */
function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Detect device type from user agent
 */
function getDeviceType(
  userAgent: string
): 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BOT' | 'UNKNOWN' {
  if (isBot(userAgent)) return 'BOT';

  const ua = userAgent.toLowerCase();

  if (ua.includes('tablet') || ua.includes('ipad')) return 'TABLET';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'))
    return 'MOBILE';
  if (
    ua.includes('windows') ||
    ua.includes('macintosh') ||
    ua.includes('linux')
  )
    return 'DESKTOP';

  return 'UNKNOWN';
}

/**
 * Hash IP address for privacy compliance (GDPR, CCPA)
 */
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Generate browser fingerprint from available data
 */
function generateFingerprint(
  userAgent: string,
  acceptLanguage?: string
): string {
  const data = `${userAgent}:${acceptLanguage || 'unknown'}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Generate short code for attribution link
 */
function generateShortCode(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if click should be counted (deduplication)
 */
async function shouldCountClick(
  linkId: string,
  ipHash: string,
  fingerprint: string
): Promise<boolean> {
  // Check if IP+fingerprint combination clicked in last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentClicks = await db
    .collection('attributionClicks')
    .where('linkId', '==', linkId)
    .where('ipHash', '==', ipHash)
    .where('fingerprint', '==', fingerprint)
    .where('timestamp', '>', yesterday)
    .limit(1)
    .get();

  return recentClicks.empty;
}

/**
 * Firebase Function: Create Attribution Link
 * Callable function to create a new attribution/tracking link
 */
export const createAttributionLink = onRequest(
  { cors: true, region: 'asia-south1' },
  async (req, res) => {
    try {
      const {
        originalUrl,
        campaignId,
        submissionId,
        creatorId,
        expiresAt,
        userId,
        userDisplayName
      } = req.body;

      if (!originalUrl || !userId) {
        res.status(400).json({ error: 'originalUrl and userId are required' });
        return;
      }

      const shortCode = generateShortCode();
      const fullShortUrl = `https://workern.app/l/${shortCode}`;

      const linkData = {
        id: shortCode,
        shortCode,
        originalUrl,
        fullShortUrl,
        campaignId: campaignId || null,
        submissionId: submissionId || null,
        creatorId: creatorId || null,
        totalClicks: 0,
        uniqueClicks: 0,
        botClicks: 0,
        lastClickedAt: null,
        clicksByCountry: {},
        clicksByDevice: {},
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: firestoreWriteTimestamp,
        updatedAt: firestoreWriteTimestamp,
        owner: { uid: userId, name: userDisplayName || 'Unknown' },
        space: { id: 'attributionApp' }
      };

      // Save to Firestore (global path + user path)
      const batch = db.batch();

      // Global path
      const globalRef = db
        .collection('apps/attributionApp/links')
        .doc(shortCode);
      batch.set(globalRef, linkData);

      // User path
      const userRef = db
        .collection(`users/${userId}/mySpaces/attributionApp/links`)
        .doc(shortCode);
      batch.set(userRef, linkData);

      await batch.commit();

      res.json({
        success: true,
        link: linkData
      });
    } catch (error) {
      console.error('Error creating attribution link:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Firebase Function: Track Click (Redirect)
 * HTTP endpoint that tracks click and redirects to original URL
 */
export const trackClick = onRequest(
  { cors: true, region: 'asia-south1' },
  async (req, res) => {
    try {
      const shortCode = req.path.replace('/l/', '').replace('/', '');

      if (!shortCode) {
        res.status(400).send('Invalid link');
        return;
      }

      // Get link from Firestore
      const linkDoc = await db
        .collection('apps/attributionApp/links')
        .doc(shortCode)
        .get();

      if (!linkDoc.exists) {
        res.status(404).send('Link not found');
        return;
      }

      const linkData = linkDoc.data();

      if (!linkData?.isActive) {
        res.status(410).send('Link expired or inactive');
        return;
      }

      if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
        res.status(410).send('Link expired');
        return;
      }

      // Extract request data
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || undefined;
      const referrer =
        req.headers['referer'] || req.headers['referrer'] || undefined;

      const ipHash = hashIP(String(ipAddress));
      const fingerprint = generateFingerprint(
        String(userAgent),
        String(acceptLanguage)
      );
      const deviceType = getDeviceType(String(userAgent));
      const isBotRequest = isBot(String(userAgent));

      // Check if click should be counted (deduplication)
      const isUniqueClick = await shouldCountClick(
        shortCode,
        ipHash,
        fingerprint
      );

      // Save click data
      const clickData = {
        linkId: shortCode,
        timestamp: firestoreWriteTimestamp,
        ipAddress: String(ipAddress),
        ipHash,
        userAgent: String(userAgent),
        deviceType,
        isBot: isBotRequest,
        referrer,
        fingerprint,
        counted: !isBotRequest && isUniqueClick
      };

      // Save click asynchronously (don't block redirect)
      db.collection('attributionClicks').add(clickData);

      // Update link analytics
      const updateData: any = {
        totalClicks: admin.firestore.FieldValue.increment(1),
        lastClickedAt: firestoreWriteTimestamp,
        updatedAt: firestoreWriteTimestamp
      };

      if (isBotRequest) {
        updateData.botClicks = admin.firestore.FieldValue.increment(1);
      } else if (isUniqueClick) {
        updateData.uniqueClicks = admin.firestore.FieldValue.increment(1);
      }

      // Update country clicks
      updateData[`clicksByDevice.${deviceType}`] =
        admin.firestore.FieldValue.increment(1);

      // Update both global and user paths
      const batch = db.batch();
      batch.update(linkDoc.ref, updateData);

      if (linkData.owner?.uid) {
        const userLinkRef = db
          .collection(
            `users/${linkData.owner.uid}/mySpaces/attributionApp/links`
          )
          .doc(shortCode);
        batch.update(userLinkRef, updateData);
      }

      batch.commit().catch(console.error);

      // Redirect to original URL
      res.redirect(302, linkData.originalUrl);
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(500).send('Internal server error');
    }
  }
);

/**
 * Firebase Function: Get Analytics
 * Callable function to retrieve analytics for an attribution link
 */
export const getAttributionAnalytics = onRequest(
  { cors: true, region: 'asia-south1' },
  async (req, res) => {
    try {
      const { linkId } = req.body;

      if (!linkId) {
        res.status(400).json({ error: 'linkId is required' });
        return;
      }

      const linkDoc = await db
        .collection('apps/attributionApp/links')
        .doc(linkId)
        .get();

      if (!linkDoc.exists) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      const linkData = linkDoc.data();

      // Get recent clicks for time-series data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentClicks = await db
        .collection('attributionClicks')
        .where('linkId', '==', linkId)
        .where('timestamp', '>', sevenDaysAgo)
        .where('isBot', '==', false)
        .get();

      // Aggregate data
      const clicksByDate: { [date: string]: number } = {};
      const clicksByCountry: { [country: string]: number } = {};

      recentClicks.forEach((doc) => {
        const click = doc.data();
        const date = new Date(click.timestamp._seconds * 1000)
          .toISOString()
          .split('T')[0];

        clicksByDate[date] = (clicksByDate[date] || 0) + 1;

        if (click.country) {
          clicksByCountry[click.country] =
            (clicksByCountry[click.country] || 0) + 1;
        }
      });

      const analytics = {
        linkId,
        totalClicks: linkData?.totalClicks || 0,
        uniqueClicks: linkData?.uniqueClicks || 0,
        botClicks: linkData?.botClicks || 0,
        conversionRate: 0, // Would need conversion tracking
        topCountries: Object.entries(clicksByCountry)
          .map(([country, clicks]) => ({ country, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10),
        topDevices: Object.entries(linkData?.clicksByDevice || {})
          .map(([device, clicks]) => ({ device, clicks }))
          .sort((a, b) => (b.clicks as number) - (a.clicks as number)),
        clicksOverTime: Object.entries(clicksByDate)
          .map(([date, clicks]) => ({ date, clicks }))
          .sort((a, b) => a.date.localeCompare(b.date))
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
