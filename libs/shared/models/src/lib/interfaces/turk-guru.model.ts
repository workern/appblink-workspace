import { Base } from './base.model';

// ── Platform Enums ────────────────────────────────────────────────────────────

export enum TurkGuruPlatform {
  MTURK = 'MTURK',
  PROLIFIC = 'PROLIFIC',
  CLOUD_RESEARCH = 'CLOUD_RESEARCH'
}

export enum TurkGuruAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR'
}

export enum TurkGuruTaskStatus {
  AVAILABLE = 'AVAILABLE',
  EXPIRED = 'EXPIRED',
  SEEN = 'SEEN'
}

// ── Models ────────────────────────────────────────────────────────────────────

/**
 * A connected platform account (MTurk, Prolific, Cloud Research).
 * Stored at:
 *   users/{uid}/mySpaces/turkGuru/accounts/{id}
 * Credentials (API keys) are stored server-side only via the connectAccount function.
 */
export interface TurkGuruAccount extends Base {
  platform: TurkGuruPlatform;
  nickname: string;
  status: TurkGuruAccountStatus;
  errorMessage?: string;
  lastCheckedAt?: Date;
}

/**
 * User notification and monitoring preferences.
 * Stored at:
 *   users/{uid}/mySpaces/turkGuru/settings/preferences
 */
export interface TurkGuruSettings {
  id: string;
  userId: string;
  minRewardCents: number;
  enabledPlatforms: TurkGuruPlatform[];
  taskKeywordFilters: string[];
  monitoringIntervalMinutes: number;
  notificationsEnabled: boolean;
  updatedAt: Date;
}

/**
 * A discovered task from a connected platform.
 * Stored at:
 *   users/{uid}/mySpaces/turkGuru/tasks/{id}
 *   apps/turkGuru/tasks/{id}  (global — for de-duplication)
 */
export interface TurkGuruTask extends Base {
  platform: TurkGuruPlatform;
  externalId: string;
  title: string;
  description?: string;
  rewardCents: number;
  rewardDisplay: string;
  taskUrl: string;
  availableAt: Date;
  expiresAt?: Date;
  status: TurkGuruTaskStatus;
  requesterName?: string;
  estimatedTimeMinutes?: number;
  qualifications?: string[];
}
