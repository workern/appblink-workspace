import { Supplier } from './supplier.model';
import { SupplyBill } from './supply-bill.model';
import { Item } from './item.model';
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { Base } from './base.model';
import { Amount } from './amount';

export interface PurchaseItem<T> extends Base<T> {
  item: Pick<Item, 'id' | 'name'>;
  bill?: Pick<SupplyBill<T>, 'id'>;
  supplier: Pick<Supplier, 'id' | 'name'>;
  rate: Amount;
  mrp: Amount;
  amount: Amount;
  batchCode: string;
  date: FieldValue | Date;
  expiryDate: Timestamp | Date | string;
  quantity: {
    total: number;
    free: number;
    purchased: number;
  };
  sellableQuantityPerUnit: number;
  sellableQuantity: number;
}
