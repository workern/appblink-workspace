import { Base } from '../common';
import { Timestamp } from '@angular/fire/firestore';
import { User } from './user.model';
import { SpaceInvite } from '../space/space-invite';
import { SpaceMemberRole } from '../../enums/space/space-member-role';
export type MemberRole = 'Owner' | 'Employee';

export interface SpaceMember {
  id: string;
  spaceId: string;
  info: User;
  invite?: SpaceInvite;
  tags?: string[];
  role: SpaceMemberRole;
  stats?: any;
  joinedAt?: Timestamp;
  permissions?: Record<string, boolean>;
}
