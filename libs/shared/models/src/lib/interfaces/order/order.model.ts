import { Base } from '../base.model';
import { CartItem } from './cart-item.model';
import { Amount } from '../amount';
import { OrderStatus } from './order-status.model';
import { OrderType } from './order-type.model';
import { OrderFulfillment } from './order-fulfillment.model';
import { PaymentMethod } from './payment-method.model';
import { WorkernTime } from '..';
import { UserAddress } from '../user-address';
import { NikatShop } from '../shop';
import { Review } from '../rating.model';
export interface SubscriptionDetails {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?:
    | 'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'; // for weekly
  dateOfMonth?: number; // for monthly
}

export interface Order<T = Date> extends Base<T> {
  shop?: Pick<NikatShop, 'id' | 'name' | 'category' | 'logos' | 'address'>;
  items: CartItem[];
  subtotal?: Amount;
  fees?: {
    platform: Amount;
    delivery: Amount;
  };
  taxes?: Amount;
  totalAmount?: Amount;
  placedAt: T;
  paidAt: T | null;
  status: OrderStatus;
  scheduledDeliveryTime?: string; // e.g., "Tomorrow, 09:00 - 09:30"
  subscriptionDetails?: SubscriptionDetails;
  paymentMethod: PaymentMethod;
  type: OrderType;
  address: UserAddress;
  fulfillment?: OrderFulfillment<T>;
  review?: Pick<Review, 'id' | 'rating' | 'title' | 'content'>; // Shop review linked to this order
}
