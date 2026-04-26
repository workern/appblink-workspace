import { Base } from './base.model';

export interface Supplier extends Base {
  name: string;
  contact: string;
  email: string;
  address: string;
  gstin: string;
}
