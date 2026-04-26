import { TransactionProcessorID } from './transaction/transaction-processor-id';

export interface GatewayOrderCreationResult {
  name: TransactionProcessorID;
  data: any;
}
