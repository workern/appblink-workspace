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
