import { Base } from './base.model';
import { Amount } from './amount';

export type SubmissionStatus =
  | 'NOT_APPLIED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED_FOR_PAYMENT'
  | 'PAID'
  | 'DISPUTED';

export interface ContentLink {
  platform: string;
  url: string;
  submittedAt: Date;
}

export interface SubmissionAnalytics {
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  earningsGenerated: Amount;
  lastUpdated: Date;
}

export interface Submission extends Base {
  // References
  campaignId: string;
  campaignTitle: string;
  creatorId: string;
  creatorName: string;
  brandId: string;
  brandName: string;

  // Status
  status: SubmissionStatus;

  // Application
  applicationDate: Date;
  approvalDate?: Date;
  rejectionReason?: string;

  // Content
  contentLinks: ContentLink[];
  notes?: string; // Creator's notes about the submission

  // Attribution
  attributionLink?: string;
  attributionLinkId?: string;

  // Analytics
  analytics: SubmissionAnalytics;

  // Payment
  expectedPayment: Amount;
  actualPayment?: Amount;
  paymentDate?: Date;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface CreateSubmissionRequest {
  campaignId: string;
  notes?: string;
}

export interface UpdateSubmissionRequest {
  contentLinks: ContentLink[];
  notes?: string;
}

export interface ApproveSubmissionRequest {
  submissionId: string;
  attributionLink: string;
}

export interface RejectSubmissionRequest {
  submissionId: string;
  reason: string;
}
