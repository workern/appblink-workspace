import { Timestamp } from 'firebase-admin/firestore';
import { Space } from './space';

import { SpaceMember } from './space-member';
import { SpaceMembershipApplcationStatus } from '../../enums/spaces/space-membership-applcation-status';
import { Offering } from '../offering';

export interface SpaceMembershipApplication {
  id?: string;
  space?: Space;
  status?: SpaceMembershipApplcationStatus;
  member?: SpaceMember;
  submittedOn?: Timestamp;
  reviewedAt?: Timestamp;
  offering?: Offering;
}
