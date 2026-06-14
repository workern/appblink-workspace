import { Base } from '../../common';

/**
 * How this subscriber was added to the workspace's audience.
 * - ORDER:    User placed at least one order from this workspace
 * - EXPLICIT: User tapped "Subscribe" in the customer app
 */
export enum CommunicationSubscriberSource {
  ORDER = 'ORDER',
  EXPLICIT = 'EXPLICIT'
}

/**
 * A subscriber entry in a workspace's audience.
 *
 * Stored at:
 *   apps/{appId}/workspaces/{workspaceId}/subscribers/{userId}
 *   users/{userId}/mySpaces/{appId}/subscribers/{workspaceId}      ← user view
 *   users/{ownerId}/mySpaces/{appId}/workspaceSubscribers/{userId} ← owner view
 *
 * Only subscribers with `consentGiven: true` may receive campaigns
 * or push notification broadcasts from the workspace.
 */
export interface CommunicationSubscriber<T = Date> extends Base<T> {
  /** Firebase UID of the subscribing customer */
  userId: string;

  /** ID of the workspace they subscribed to */
  workspaceId: string;

  /** Display name of the subscriber (from their profile at subscription time) */
  displayName: string;

  /** Phone number — required for WhatsApp campaigns */
  phone?: string;

  /** E-mail — optional, for future email channel */
  email?: string;

  /**
   * Whether the subscriber has explicitly consented to receive marketing
   * communications from the workspace.
   *
   * `true`  → consent given explicitly (EXPLICIT source, or agreed at order checkout)
   * `false` → user placed an order but did NOT opt-in to communications
   *
   * Only `true` subscribers may be targeted for campaigns.
   */
  consentGiven: boolean;

  /** Which action caused this subscriber entry to be created or last updated */
  source: CommunicationSubscriberSource;

  /** ISO timestamp of when the subscriber most recently interacted (e.g., placed order) */
  lastInteractionAt: T;
}
