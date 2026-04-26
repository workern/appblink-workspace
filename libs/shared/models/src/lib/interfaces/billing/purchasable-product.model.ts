import { APPID } from '../../enums';
import { Amount } from '../amount';
import { Base } from '../base.model';
import { TransactionProcessorID } from '../transaction/transaction-processor-id';
import { BillingIntervalUnit } from './billing-interval-unit';
import { PaymentType } from './payment-type';
import { ProductStatus } from './product-status';

export interface ProductGatewayPrice {
  amount: Amount;
  intervalCount?: number;
  intervalUnit?: BillingIntervalUnit;
  trialDays?: number;
  displayLabel?: string;
}

export interface ProductGatewayConfig {
  gateway: TransactionProcessorID;
  enabled: boolean;
  externalProductId?: string;
  externalPriceId?: string;
  checkoutUrl?: string;
  price: ProductGatewayPrice;
  metadata?: Record<string, unknown>;
}

export interface PurchasableProduct<T = Date> extends Base<T> {
  /** ID of the parent entitlement (entitlements/{entitlementId}) */
  entitlementId: string;
  key: string;
  app: {
    id: APPID;
    name?: string;
  };
  name: string;
  description?: string;
  paymentType: PaymentType;
  status: ProductStatus;
  features?: string[];
  sortOrder?: number;
  gateways: Partial<Record<TransactionProcessorID, ProductGatewayConfig>>;
  metadata?: Record<string, unknown>;
}
