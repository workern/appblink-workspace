import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { SpaceMemberStats } from './space-member-stats';

import { SpaceInvite } from './space-invite';
import { SpaceMemberRole } from '../../enums/spaces/space-member-role';
import { PublicUser } from '../public-user';
import { UserRating } from '../user-rating';

export interface SpaceMemberInfo {
  uid: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  rating?: UserRating | null;
}

export interface SpaceMember {
  id: string;
  spaceId: string;
  info: SpaceMemberInfo;
  invite: SpaceInvite;
  tags: string[];
  role: SpaceMemberRole;
  stats: SpaceMemberStats;
  joinedAt: Timestamp | FieldValue;
  claims: any;
}
