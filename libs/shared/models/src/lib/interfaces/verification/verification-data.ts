import { VerificationStatus } from './verification-status.model';
import { KycDocument } from '../kyc-document.model';

/**
 * Person who handled the verification (approved or rejected)
 */
export interface HandledBy {
  uid: string;
  name: string;
  email: string;
}

/**
 * Common Verification model
 * Used across Items, Shops, Products, and Delivery Partners
 */
export interface Verification<T = Date> {
  status: VerificationStatus;
  handledBy?: HandledBy | null;
  verifiedAt?: T | null;
  updatedAt?: T | null;
  remarks?: string;
  notes?: string;
  documents?: Record<string, KycDocument>;
}

/**
 * @deprecated Use Verification instead
 */
export type VerificationData = Verification;
