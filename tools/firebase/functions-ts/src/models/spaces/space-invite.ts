import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { PublicUser } from '../public-user';
import { SpaceMemberInfo } from './space-member';

export interface SpaceInvite {
  sender: SpaceMemberInfo;
  sentAt: Timestamp | FieldValue;
}
