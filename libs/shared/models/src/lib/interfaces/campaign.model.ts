import { Base } from './base.model';
import { Amount } from './amount';

export type CampaignType = 'PROMOTION' | 'SPONSORSHIP' | 'AFFILIATE';

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type SocialPlatform =
  | 'INSTAGRAM'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'TWITTER'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'TWITCH';

export type ContentGenre =
  | 'BEAUTY'
  | 'FASHION'
  | 'TECH'
  | 'SPORTS'
  | 'GAMING'
  | 'FOOD'
  | 'TRAVEL'
  | 'LIFESTYLE'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'FITNESS'
  | 'BUSINESS'
  | 'OTHER';

export interface PlatformRequirement {
  platform: SocialPlatform;
  minFollowers: number;
}

export interface MediaFile {
  url: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
}

export interface Campaign extends Base {
  // Basic Info
  title: string;
  type: CampaignType;
  status: CampaignStatus;

  // Campaign Details
  targetUrl: string;
  description: string;
  mediaFiles: MediaFile[];

  // Creator Requirements
  platformRequirements: PlatformRequirement[];
  genres: ContentGenre[];
  numberOfCreatorsNeeded: number;
  autoAccept: boolean; // Auto-accept eligible creators or require approval
  onlyVerifiedCreators: boolean;

  // Geographic & Language
  targetCountries: string[]; // ISO country codes
  contentLanguage: string; // ISO language code

  // Budget
  budgetPerCreator: Amount;
  totalBudget: Amount;

  // Tracking
  applicationsCount: number;
  acceptedCount: number;
  completedCount: number;

  // Dates
  startDate: Date;
  endDate: Date;

  // Attribution Link (generated after creation)
  attributionLinkId?: string;
}

export interface CreateCampaignRequest {
  title: string;
  type: CampaignType;
  targetUrl: string;
  description: string;
  mediaFiles: MediaFile[];
  platformRequirements: PlatformRequirement[];
  genres: ContentGenre[];
  numberOfCreatorsNeeded: number;
  autoAccept: boolean;
  onlyVerifiedCreators: boolean;
  targetCountries: string[];
  contentLanguage: string;
  budgetPerCreator: Amount;
  startDate: Date;
  endDate: Date;
}
