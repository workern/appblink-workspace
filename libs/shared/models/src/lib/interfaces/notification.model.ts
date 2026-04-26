import { Base } from './base.model';

export interface WorkernNotification extends Base {
  title: string;
  description: string;
  type: string;
  seen: boolean;
  imageUrl?: string;
  data?: any;
}
