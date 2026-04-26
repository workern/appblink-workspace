import { Product } from './product.model';
import { Base } from '../base.model';
export interface CartItem<T = Date> extends Base {
  product: Product;
  quantity: number;
  variantId: string; // Optional variant ID for products with multiple variants
  addedAt: T; // Firestore timestamp
}
