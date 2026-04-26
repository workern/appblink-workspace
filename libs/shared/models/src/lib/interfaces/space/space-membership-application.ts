import { WorkernTime } from '..';
import { Space } from './space';
import { SpaceMember } from './space-member';
import { SpaceMembershipApplicationStatus } from '../../enums/space/space-membership-application-status';

/**
 * Space Membership Application
 * Represents a user's application to join a space
 * Fixed: Renamed from SpaceMembershipApplcationStatus (typo)
 */
export interface SpaceMembershipApplication<T = Date> {
  id?: string;
  space?: Space<T>;
  status?: SpaceMembershipApplicationStatus;
  member?: SpaceMember<T>;
  submittedOn?: WorkernTime<T>;
  reviewedAt?: WorkernTime<T>;
  offering?: any; // TODO: Define proper Offering interface
  uploads?: any[];
}
