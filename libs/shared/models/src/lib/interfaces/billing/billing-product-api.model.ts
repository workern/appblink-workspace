import { GatewayOrderCreationResult } from '../gateway';
import { TransactionProcessorID } from '../transaction/transaction-processor-id';
import { PaymentType } from './payment-type';
import { PurchasableProduct } from './purchasable-product.model';

export interface GetProductsForAppRequest {
  appId: string;
  paymentType?: PaymentType;
  gateway?: TransactionProcessorID;
  includeInactive?: boolean;
}

export interface GetProductsForAppResponse {
  appId: string;
  products: PurchasableProduct[];
}

export interface CreateProductCheckoutRequest {
  appId: string;
  productId: string;
  gateway: TransactionProcessorID;
  quantity?: number;
  langCode?: string;
  metadata?: Record<string, unknown>;
}

export type ProductCheckoutMode = 'EXTERNAL_CHECKOUT' | 'IN_APP_PURCHASE';

export interface CreateProductCheckoutResponse {
  mode: ProductCheckoutMode;
  gateway: GatewayOrderCreationResult;
  product: PurchasableProduct;
  transactionId?: string;
}
