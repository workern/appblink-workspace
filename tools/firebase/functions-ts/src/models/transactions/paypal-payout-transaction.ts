import { TRANSACTION_PROCESSOR_PAYPAL } from '../../constants';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TransactionType } from '../../enums/transactions/transaction-type';
import { Amount } from '@workern/models';
import { Transaction } from './transaction';
import { TransactionProcessor } from './transaction-processor';

export class PaypalPayoutTransaction extends Transaction {
  constructor(attrs: {
    state: string;
    id: string;
    amount: Amount;
    uid: string;
    message: string;
    reason?: TransactionReason;
    type?: TransactionType;
  }) {
    attrs.type = TransactionType.DEBIT;
    attrs.reason = TransactionReason.WITHDRAWL;
    super(attrs);
    this.processor = {
      id: TRANSACTION_PROCESSOR_PAYPAL,
      data: {}
    };
  }
}
