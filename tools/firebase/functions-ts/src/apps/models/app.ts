import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AppType } from '../enums/app-type';
import { PublicUserInterface } from '../../interface';

export class App {
  public id: string;
  public spaceId: string;
  public owner: PublicUserInterface;
  public title: string;
  public state: 'DRAFT' | 'PUBLISHED' = 'DRAFT';
  public type: AppType;
  public createdAt: Timestamp = Timestamp.now();
  public updatedAt: FieldValue | Timestamp = Timestamp.now();
  constructor(data: any = {}) {
    this.id = data.id || '';
    this.spaceId = data.spaceId || '';
    this.title = data.title || 'Visit Request Form';
    this.state = data.state || 'DRAFT';
    this.createdAt = data.createdAt || FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || FieldValue.serverTimestamp();
    this.owner = data.owner != null ? data.owner : null;
  }

  forFirestore() {
    const app = Object.assign({}, this);
    return app;
  }
}
