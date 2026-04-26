import { WorkernTime } from '.';

/**
 * KYC Document Type enum
 * Covers all document types across Sangrah shops and Nikat delivery partners
 */
export enum KycDocumentType {
  // Delivery Partner Documents
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VEHICLE_RC = 'VEHICLE_RC',
  BANK_PASSBOOK = 'BANK_PASSBOOK',
  PROFILE_PHOTO = 'PROFILE_PHOTO',

  // Shop Documents
  SHOP_ACT = 'SHOP_ACT',
  SHOP_IMAGE = 'SHOP_IMAGE',
  ID_PROOF = 'ID_PROOF',

  // General
  PHOTO = 'PHOTO',
  OTHER = 'OTHER'
}

/**
 * KYC Document Status enum
 */
export enum KycDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Common KYC Document model
 * Used across Sangrah shops and Nikat delivery partners
 */
export interface KycDocument {
  id?: string;
  type?: KycDocumentType;
  storageUrl?: string;
  uploadedAt?: WorkernTime;
  status?: string;
  rejectionReason?: string;
}
