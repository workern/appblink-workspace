import { WorkernTime } from '..';
import { SpaceMemberStats } from './space-member-stats';
import { SpaceInvite } from './space-invite';
import { SpaceMemberRole } from '../../enums/space/space-member-role';

/**
 * Space Member User Rating
 */
export interface UserRating {
  average: number;
  count: number;
}

/**
 * Space Member Information
 * Lighter version of full user for space context
 */
export interface SpaceMemberInfo {
  uid: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  photoURL?: string | null;
  rating?: UserRating | null;
}

/**
 * Space Member
 * Represents a member (user) in a space with role, stats, and permissions
 */
export interface SpaceMember<T = Date, K = SpaceMemberRole> {
  id: string;
  spaceId: string;
  info: SpaceMemberInfo;
  invite?: SpaceInvite<T>;
  tags?: string[];
  role: K;
  stats?: SpaceMemberStats;
  joinedAt?: WorkernTime<T>;
  claims?: any;
  permissions?: {
    challansView?: boolean;
    challansEdit?: boolean;
    stockView?: boolean;
    stockEdit?: boolean;
    employeeView?: boolean;
    employeeEdit?: boolean;
  };
}
