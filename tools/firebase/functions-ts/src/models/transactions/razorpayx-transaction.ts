import { TRANSACTION_PROCESSOR_RAZORPAY_X } from '../../constants';
import { Transaction } from './transaction';
import { TransactionProcessor } from './transaction-processor';
import { Amount } from '@workern/models';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TransactionState } from '../../enums/transactions/transaction-state';
import { TransactionType } from '../../enums/transactions/transaction-type';

export class RazorpayXTransaction extends Transaction {
  constructor(data: {
    state: TransactionState;
    id: string;
    amount: Amount;
    uid: string;
    message: string;
    processor?: TransactionProcessor;
    type?: TransactionType;
    reason?: TransactionReason;
  }) {
    data.type = TransactionType.DEBIT;
    data.reason = TransactionReason.WITHDRAWL;
    super(data);
    this.processor = {
      id: TRANSACTION_PROCESSOR_RAZORPAY_X,
      data: {}
    };
  }

  public forFirestore(entity: 'frontend_user' | 'admin') {
    const transaction = super.forFirestore(entity);
    if (this.processor.data) {
      if (entity === 'frontend_user') {
        const { short_url } = this.processor.data.payoutLink;
        const filteredObject = { payoutLink: { url: short_url } };
        transaction.processor.data = filteredObject;
      } else if (entity === 'admin') {
        transaction.processor.data = Object.assign({}, this.processor.data);
      }
    }

    return transaction;
  }
}
