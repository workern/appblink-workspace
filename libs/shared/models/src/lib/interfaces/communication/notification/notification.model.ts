import { Base } from '../../common';

export interface WorkernNotification extends Base {
  title: string;
  description: string;
  type: string;
  seen: boolean;
  imageUrl?: string;
  data?: any;
}
