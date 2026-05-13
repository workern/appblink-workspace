import { WorkernTime } from '..';
import { SpaceMemberInfo } from './space-member';

/**
 * Space Invite
 * Information about who invited a member to a space
 */
export interface SpaceInvite<T = Date> {
  sender: SpaceMemberInfo;
  sentAt: WorkernTime<T>;
}
