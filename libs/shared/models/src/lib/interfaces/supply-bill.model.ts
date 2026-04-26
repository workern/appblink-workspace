import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { Supplier } from './supplier.model';
import { PurchaseItem } from './purchase-item.model';
import { Base } from './base.model';
import { Amount } from './amount';
export interface SupplyBill<T> extends Base<T> {
  supplier: Supplier;
  grossAmount?: Amount | number;
  gst?: Amount | number;
  totalAmount: Amount | number;
  items: PurchaseItem<T>[];
  date: FieldValue | Timestamp | Date | number | string;
  imageUrl: string;
  number: string;
}
export interface EditableSupplyBill<T> extends Omit<
  SupplyBill<T>,
  'items' | 'uploadedAt' | 'imageUrl' | 'date'
> {
  items: PurchaseItem<T>[];
  grossAmount?: number;
  gst?: number;
  date: string | Date;
  totalAmount: number;
}

export interface DatabaseSupplyBill<T> extends Omit<
  SupplyBill<T>,
  'grossAmount' | 'gst' | 'totalAmount'
> {
  grossAmount?: Amount;
  gst?: Amount;
  totalAmount: Amount;
}
