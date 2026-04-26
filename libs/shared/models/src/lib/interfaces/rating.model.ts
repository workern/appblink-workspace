import { NikatShop } from './shop';
import { Order } from './order';
import { Item } from './item.model';

/**
 * Professional rating system similar to Zomato/Google Reviews
 * Tracks aggregate ratings and review distribution
 */
export interface RatingDistribution {
  /** Count of 1-star reviews */
  one: number;
  /** Count of 2-star reviews */
  two: number;
  /** Count of 3-star reviews */
  three: number;
  /** Count of 4-star reviews */
  four: number;
  /** Count of 5-star reviews */
  five: number;
}

export interface Rating<T = Date> {
  /** Average rating (0-5) calculated from all reviews */
  average: number;

  /** Total number of reviews received */
  totalReviews: number;

  /** Distribution of reviews by star count */
  distribution: RatingDistribution;

  /** Timestamp of the most recent review */
  lastReviewedAt?: T;

  /** Month-wise review statistics for trending */
  monthlyReviews?: {
    [monthKey: string]: number; // Format: "2026-01" for January 2026
  };
}

/**
 * Individual review document
 * Stored in subcollection: shops/{shopId}/reviews/{reviewId}
 * or products/{productId}/reviews/{reviewId}
 */
export interface Review<T = Date> {
  id: string;
  rating: number; // 1-5
  title: string;
  content: string;

  /** For product reviews: the shop ID */
  shop: Pick<NikatShop, 'id'>;

  /** For shop/product reviews: the order ID this review is tied to */
  order: Pick<Order, 'id'>;

  /** For product reviews: the product ID */
  product: Pick<Item, 'id'> | null;

  user: { uid: string; name: string; photoUrl?: string };
  /**
   * Verification status: whether this review is from a verified buyer
   * (user who has completed an order with delivery)
   */
  isVerifiedBuyer: boolean;

  /** Total helpful votes */
  helpfulCount: number;

  /** Total unhelpful votes */
  unhelpfulCount: number;

  /** Images/evidence for the review */
  attachmentUrls?: string[];

  /** Review status: pending approval, approved, rejected, etc. */
  status: 'pending' | 'approved' | 'rejected' | 'archived';

  createdAt: T;
  updatedAt: T;
}

/**
 * Request payload for adding/updating a review
 * Sent from client to Cloud Function
 */
export interface AddReviewRequest {
  rating: number; // 1-5
  title: string;
  content: string;

  /** shopId for shop reviews, productId for product reviews */
  targetId: string;

  targetType: 'shop' | 'product';

  /** orderId to verify delivery completion */
  orderId: string;

  /** productId (only for product reviews) */
  productId?: string;

  /** shopId (required for product reviews) */
  shopId?: string;

  attachmentUrls?: string[];
}
