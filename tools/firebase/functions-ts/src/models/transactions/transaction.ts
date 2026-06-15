import { Timestamp } from 'firebase-admin/firestore';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TransactionState } from '../../enums/transactions/transaction-state';
import { TransactionType } from '../../enums/transactions/transaction-type';
import { firestoreWriteTimestamp, isProduction } from '../../global';
import { Amount } from '@workern/models';
import { TransactionProcessor } from './transaction-processor';

/** Minimal task reference stored inside transaction notes. */
interface TransactionTaskRef {
  id: string;
  spaceId: string;
}
export class Transaction {
  public id: string;
  public uid: string;
  public state: TransactionState;
  public message: string;
  public amount: Amount;
  public type: TransactionType;
  public reason: TransactionReason;
  public createdAt: any = firestoreWriteTimestamp;
  public finalizedAt: any = null;
  public processor: TransactionProcessor;
  public notes: Record<string, any> = {};
  constructor(
    data:
      | {
          state: string;
          type: string;
          id: string;
          amount: number | Amount;
          uid: string;
          message: string;
          processor?: TransactionProcessor;
          task?: TransactionTaskRef;
          reason: TransactionReason;
          createdAt: Timestamp;
          finalizedAt: Timestamp;
          notes?: Record<string, any>;
        }
      | any
  ) {
    if (data) {
      this.state = data.state;
      this.type = data.type;
      this.reason = data.reason;
      this.amount =
        data.amount != null
          ? typeof data.amount == 'number'
            ? { value: data.amount, currency: 'INR', symbol: '₹' }
            : data.amount
          : null;
      this.id = data.id;
      this.uid = data.uid;
      this.message = data.message || null;
      this.processor = data.processor != null ? data.processor : null;
      this.createdAt = data.createdAt || Timestamp.now();
      this.finalizedAt = data.finalizedAt || null;
      this.notes = data.notes || {};
      // notes.task is stored as a plain { id, spaceId } reference — no class wrapping needed.
    }
  }

  forFirestore(entity: 'frontend_user' | 'admin') {
    const transaction: any = Object.assign({}, this);

    transaction.amount = Object.assign({}, this.amount);
    if (this.processor) {
      if (entity === 'frontend_user') {
        delete transaction.processor.data;
      }
    }
    if (this.notes.task) {
      // notes.task is already a plain { id, spaceId } object — copy it as-is.
      transaction.task = { ...this.notes.task };
    }

    return transaction;
  }

  getRedirectURL(): string {
    let redirectHost = `${isProduction ? 'https://workern.com' : 'http://localhost:9002'}`;
    let redirectPath = `/dashboard/${this.notes.productId}?tab=billing`;

    const resolver = redirectResolvers.get(this.notes.source);
    if (resolver) {
      const result = resolver(this);
      redirectHost = result.redirectHost;
      redirectPath = result.redirectPath;
    }

    return `${redirectHost}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}status=success&transactionId=${this.id}`;
  }
}

export type RedirectResolver = (
  transaction: Transaction
) => { redirectHost: string; redirectPath: string };

const redirectResolvers = new Map<string, RedirectResolver>();

export function registerRedirectResolver(
  source: string,
  resolver: RedirectResolver
) {
  redirectResolvers.set(source, resolver);
}

