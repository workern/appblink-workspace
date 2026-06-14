import { Base } from '../common/base.model';

export type CampaignChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'NOTIFICATION';
export type CampaignStatus = 'DRAFT' | 'SENDING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface Campaign extends Base {
  shopId: string;
  name: string;
  message: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  totalTargets: number;
  successCount: number;
  failCount: number;
  errors?: Record<string, string>;
  completedAt?: Date;
}
