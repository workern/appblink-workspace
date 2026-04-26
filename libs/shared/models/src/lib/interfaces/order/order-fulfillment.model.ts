import { DeliveryPerson } from '../delivery/delivery-person.model';
import { DeliveryManagedBy } from '../delivery/delivery-managed-by';
import { DeliveryStatus } from '../../enums/delivery/delivery-status.enum';
import { WorkernTime } from '../index';
export type OrderFulfillment<T = Date> = {
  managedBy: DeliveryManagedBy;
  status: DeliveryStatus;

  // delivery person may be unassigned
  deliveryPerson?: DeliveryPerson | null;

  // expected delivery - prefer ISO string or Firestore Timestamp
  expectedDeliveryBy?: WorkernTime; // ISO datetime or WorkernTime (explicitly documented)

  // timestamps
  assignedAt?: WorkernTime<T>; // ISO timestamp
  updatedAt?: WorkernTime<T>; // last update timestamp
  deliveredAt?: WorkernTime<T>; // when delivered
  lastUpdatedLocationAt?: WorkernTime<T>;

  // verification & tracking
  otpForDelivery?: string; // short lived OTP if using OTP verification
  proofOfDelivery?: {
    type: 'PHOTO' | 'SIGNATURE' | 'NONE' | string;
    url?: string; // storage link to photo / signature
  } | null;
  trackingUrl?: string | null;

  // retry / failure info
  attempts?: number; // number of delivery attempts
  failureReason?: string | null;

  // free-form notes
  customerNotes?: string | null;

  // optionally store last known GPS of the parcel (for live tracking)
  lastKnownLocation?: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    recordedAt?: string;
  } | null;
};
