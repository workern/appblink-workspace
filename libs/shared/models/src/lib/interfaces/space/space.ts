import { WorkernTime } from '..';
import { SpaceMemberInfo } from './space-member';
import { SpaceStats } from './space-stats';
import { SpaceVisibility } from '../../enums/space/space-visibility';

/**
 * Space
 * Represents a workspace/organization with members, settings, and stats
 */
export interface Space<T = Date> {
  id: string;
  title: string;
  owner: SpaceMemberInfo;
  description?: string;
  createdAt?: WorkernTime<T>;
  updatedAt?: WorkernTime<T>;
  visibility?: SpaceVisibility;
  stats?: SpaceStats;
  photoURL?: string;
  coverPhotoURL?: string;
  tags?: string[];
  settings?: {
    allowPublicApplications?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
  };
}
