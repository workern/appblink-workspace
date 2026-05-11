import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface Conversation {
  id: string;
  updatedAt: FieldValue;
  business: {
    phoneNumberId: string;
    uid: string;
  };
  customer: {
    name: string;
    avatar: string;
    displayPhoneNumber: string;
    contact: {
      id: string;
    };
  };
  lastMessage: string;
  lastMessageId: string;
}

export interface Message {
  id: string;
  type: 'text' | string;
  body: string;
  status: 'delivered' | 'sent' | 'read' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sender: 'customer' | 'business';
  receiver: 'customer' | 'business';
}
