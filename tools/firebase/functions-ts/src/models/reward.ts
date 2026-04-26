import { Amount } from '@workern/models';

export interface Reward extends Amount {
  type: 'fixed' | 'bid';
}
