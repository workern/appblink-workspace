import { DeliveryStatus } from '../enums';
import { DeliveryPerson } from './delivery';
import { OrderStatus } from './order/order-status.model';

export interface UpdateStatusFulfillment {
  status: DeliveryStatus;
  deliveryPerson?: DeliveryPerson;
}

export interface UpdateOrderStatusRequest {
  id: string;
  status?: OrderStatus;
  fulfillment?: UpdateStatusFulfillment;
  otp?: string;
  saveDeliveryPerson?: boolean;
}
