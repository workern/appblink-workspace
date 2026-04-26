import { Timestamp } from 'firebase-admin/firestore';
export class Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: Timestamp;
  seen = false;
  data: any;

  constructor(params: any = {}) {
    this.id = params.id;
    this.title = params.title || '';
    this.description = params.description || '';
    this.type = params.type || '';
    this.seen = params.seen || false;
    this.createdAt = params.createdAt || Timestamp.now();
    this.data = params.data || null;
  }

  forFirestore() {
    const notification = Object.assign({}, this);
    return notification;
  }
}
