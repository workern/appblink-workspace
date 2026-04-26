import { Transaction } from '../models/transactions/transaction';
import { GatewayOrderCreationResult } from '@workern/models';
export interface GatewayOrderAndFirestoreEntryResponse {
  gateway: GatewayOrderCreationResult;
  transaction: Transaction;
  success: boolean;
}
