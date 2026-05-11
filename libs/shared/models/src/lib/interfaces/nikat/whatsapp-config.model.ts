import { Base } from '../base.model';

/**
 * Stored at: users/{shopOwnerId}/mySpaces/${APPID.NIKAT}/whatsappConfig
 *
 * Holds the WhatsApp Business Account connection info for a Nikat shop owner.
 * Populated after the shop owner completes the Embedded Signup flow.
 */
export interface WhatsAppConfig extends Base {
  /** WhatsApp Business Account ID (WABA ID) assigned by Meta */
  wabaId: string;

  /** Phone Number ID for the business phone registered on this WABA */
  phoneNumberId: string;

  /** Human-readable display phone number (e.g. "+91 98765 43210") */
  displayPhoneNumber: string;

  /** Verified name of the WhatsApp Business profile */
  verifiedName: string;

  /** Whether webhook is subscribed for this WABA */
  webhookSubscribed: boolean;

  /** Connection status */
  status: WhatsAppConnectionStatus;
}

export enum WhatsAppConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}
