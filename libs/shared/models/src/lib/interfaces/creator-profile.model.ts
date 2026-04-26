import { Base } from './base.model';
import { ContentGenre, SocialPlatform } from './campaign.model';
import { Amount } from './amount';

export interface SocialHandle {
  platform: SocialPlatform;
  handle: string;
  url: string;
  followersCount: number;
  verified: boolean; // Platform verified (e.g., blue checkmark)
  isConnected: boolean; // OAuth connected
}

export interface CreatorProfile extends Base {
  // Basic Info
  displayName: string;
  bio: string;
  profilePicture?: string;

  // Social Handles
  socialHandles: SocialHandle[];

  // Content Details
  genres: ContentGenre[];
  contentLanguages: string[]; // ISO language codes

  // Geographic
  country: string; // ISO country code
  city?: string;

  // Verification
  isVerified: boolean; // Verified by platform admin
  verificationDate?: Date;

  // Stats
  totalEarnings: Amount;
  completedCampaigns: number;
  averageRating?: number;

  // Status
  isActive: boolean;
  availableForWork: boolean;
}

export interface CreateCreatorProfileRequest {
  displayName: string;
  bio: string;
  profilePicture?: string;
  socialHandles: SocialHandle[];
  genres: ContentGenre[];
  contentLanguages: string[];
  country: string;
  city?: string;
}

export interface UpdateCreatorProfileRequest extends Partial<CreateCreatorProfileRequest> {
  availableForWork?: boolean;
}
