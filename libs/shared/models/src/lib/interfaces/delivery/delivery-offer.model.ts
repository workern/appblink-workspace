import { WorkernTime } from '../index';
import { Amount } from '../amount';
import { ShopAddress } from '../shop/shop-address';
import { ShopOwnerRecord } from '../shop';

/**
 * DeliveryOffer - Offer sent to partners
 * Stored in: deliveryPartners/{partnerId}/offers/{orderId}
 *
 * Flow:
 * 1. System creates offers for top N nearby partners
 * 2. Partners see offers in their inbox
 * 3. First to accept gets the delivery (atomic transaction)
 * 4. All other offers expire automatically
 */
export enum DeliveryOfferStatus {
  PENDING = 'PENDING', // Offer created, awaiting partner response,
  ACCEPTED = 'ACCEPTED', // Partner accepted the offer
  REJECTED = 'REJECTED', // Partner rejected the offer
  EXPIRED = 'EXPIRED' // Offer expired (TTL)
}

export type DeliveryOffer<T = Date> = {
  id: string; // Same as orderId
  orderId: string;

  // Shop and delivery details
  shop: Pick<ShopOwnerRecord, 'id' | 'name' | 'address'>;
  pickupLocation: {
    lat: number;
    lng: number;
  };
  pickupAddress: ShopAddress;

  dropLocation: {
    lat: number;
    lng: number;
  };
  dropAddress: string;

  // Distance and payout
  distanceKm: number; // Total distance (partner -> shop -> customer)
  estimatedPartnerDistanceKm: number; // Partner to shop
  payout: Amount; // Partner earnings

  // Offer lifecycle
  status: DeliveryOfferStatus;
  createdAt: WorkernTime<T>;
  expiresAt: WorkernTime<T>; // TTL (e.g. 30 seconds)

  // Response tracking
  respondedAt?: WorkernTime<T>;
};
