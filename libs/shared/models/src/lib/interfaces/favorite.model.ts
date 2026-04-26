import { Base } from './base.model';
import { Rating } from './rating.model';
export interface FavoriteProduct extends Base {
  type: 'product';
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: { value: number; currency: string; symbol: string };
  };
  shop: {
    id: string;
    name: string;
  };
}

export interface FavoriteShop extends Base {
  type: 'shop';
  shop: {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    rating: Rating;
  };
}

export type Favorite = FavoriteProduct | FavoriteShop;
