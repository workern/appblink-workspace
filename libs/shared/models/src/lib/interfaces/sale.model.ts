import { Base } from './base.model';
import { Amount } from './amount';
export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  sellableQuantity: number;
  subTotal: Amount;
  discount: {
    rate: number;
    amount: Amount;
  };
  netTotal: Amount;
}

export interface Customer {
  name: string;
  phone: string;
}

export interface SoldBy {
  uid: string;
  name: string;
}

export interface Sale extends Base {
  id: string;
  items: { ids: string[]; details: SaleItem[] };
  soldBy: SoldBy;
  status: 'complete' | 'pending' | 'cancelled';
  customer: Customer;
  totalAmount: number;
  totalDiscount: number;
  grandTotal: number;
}
