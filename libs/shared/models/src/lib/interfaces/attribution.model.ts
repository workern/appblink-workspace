import { Base } from './base.model';

export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BOT' | 'UNKNOWN';

export interface AttributionClick {
  timestamp: Date;
  ipAddress: string;
  ipHash: string; // Hashed IP for privacy
  userAgent: string;
  deviceType: DeviceType;
  isBot: boolean;
  referrer?: string;
  country?: string;
  city?: string;
  // Browser fingerprint for better deduplication
  fingerprint?: string;
}

export interface AttributionLink extends Base {
  // Link Details
  shortCode: string;
  originalUrl: string;
  fullShortUrl: string; // e.g., https://workern.app/l/{shortCode}

  // Context
  campaignId?: string;
  submissionId?: string;
  creatorId?: string;

  // Tracking
  totalClicks: number;
  uniqueClicks: number; // Deduplicated by IP + fingerprint
  botClicks: number;

  // Analytics
  lastClickedAt?: Date;
  clicksByCountry: { [country: string]: number };
  clicksByDevice: { [device: string]: number };

  // Status
  isActive: boolean;
  expiresAt?: Date;
}

export interface CreateAttributionLinkRequest {
  originalUrl: string;
  campaignId?: string;
  submissionId?: string;
  creatorId?: string;
  expiresAt?: Date;
}

export interface TrackClickRequest {
  shortCode: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
}

export interface AttributionAnalytics {
  linkId: string;
  totalClicks: number;
  uniqueClicks: number;
  botClicks: number;
  conversionRate: number;
  topCountries: { country: string; clicks: number }[];
  topDevices: { device: string; clicks: number }[];
  clicksOverTime: { date: string; clicks: number }[];
}
