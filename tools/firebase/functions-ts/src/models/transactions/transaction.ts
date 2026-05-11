import { Timestamp } from 'firebase-admin/firestore';
import { TransactionReason } from '../../enums/transactions/transaction-reason';
import { TransactionState } from '../../enums/transactions/transaction-state';
import { TransactionType } from '../../enums/transactions/transaction-type';
import { firestoreWriteTimestamp, isProduction } from '../../global';
import { Amount } from '@workern/models';
import { Task } from '../tasks/task';
import { TransactionProcessor } from './transaction-processor';
import { eGiftsAppSpaceId } from '../../apps/egifts-app/constants';
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
          task?: Task;
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
      if (this.notes.task) {
        this.notes.task = new Task(this.notes.task);
      }
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
      transaction.task = this.notes.task.forTransaction();
    }

    return transaction;
  }

  getRedirectURL(): string {
    let redirectHost = `${isProduction ? 'https://workern.com' : 'http://localhost:9002'}`;
    let redirectPath = `/dashboard/${this.notes.productId}?tab=billing`;
    const task = this.notes.task;

    switch (this.notes.source) {
      case 'workernLeadsApp':
        redirectHost = `${isProduction ? 'https://workern.com' : 'http://localhost:9002'}`;
        redirectPath = `/dashboard/${this.notes.productId}?tab=billing`;
        break;
      case 'nikat':
        redirectHost = `${isProduction ? 'https://nikat.workern.com' : 'http://localhost:4202'}`;
        redirectPath = `/order/success/${this.notes.order.id}`;
        break;
      case eGiftsAppSpaceId:
        redirectHost = isProduction
          ? 'https://egifts.workern.com'
          : 'http://localhost:4209';
        redirectPath =
          this.reason === TransactionReason.CUSTOM_WEBSITE_PURCHASE
            ? `/v/success?websiteId=${this.notes.websiteId}&bg=${encodeURIComponent(this.notes.bg)}${this.notes.payAsYouWish === 'true' ? `&payAsYouWish=true&amount=${this.amount.value}` : ''}`
            : ``;
        break;
      case 'workernFreelanceApp':
        redirectHost = isProduction
          ? 'https://offerings.workern.com'
          : 'http://localhost:4200';
        if (task) {
          redirectPath = task
            ? `/spaces/${task.spaceId}/tasks/${task.id}`
            : '/profile/account-details';
        } else {
          redirectPath = '/profile/account-details';
        }

        break;
    }
    return `${redirectHost}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}status=success&transactionId=${this.id}`;
  }
}
