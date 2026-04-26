import { Timestamp, FieldValue } from 'firebase-admin/firestore';

import { SpaceStats } from './space-stats';
import { SkillAssessment } from '../skill-assessment';
import { SpaceVisibility } from '../../enums/spaces/space-visibility';
import { PublicUser } from '../public-user';
import { SpaceMemberInfo } from './space-member';

export class Space {
  public id: string;
  public title: string;
  public purpose: string;
  public skillAssessment: SkillAssessment = new SkillAssessment();
  public stats: any = new SpaceStats();
  public visibility: SpaceVisibility = SpaceVisibility.PRIVATE;
  public createdAt: Timestamp | FieldValue;
  public updatedAt: Timestamp | FieldValue;
  public owner: SpaceMemberInfo;
  public hideInUI: boolean = false;
  constructor(params: any = {}, user: any = null) {
    this.id = params.id;
    this.title = params.title || '';
    this.purpose = params.purpose || '';
    this.skillAssessment = params.skillAssessment || new SkillAssessment();
    this.stats = params.stats || new SpaceStats();
    this.owner = {
      uid: params.owner.uid
    };

    this.visibility = params.visibility || SpaceVisibility.PRIVATE;
    this.createdAt =
      params.createdAt == null
        ? Timestamp.now()
        : new Timestamp(params.createdAt.seconds, params.createdAt.nanoseconds);
    this.updatedAt =
      params.updatedAt == null
        ? Timestamp.now()
        : new Timestamp(params.updatedAt.seconds, params.updatedAt.nanoseconds);
    this.hideInUI = params.hideInUI || false;
  }

  forFirestore() {
    const space = Object.assign({}, this);
    space.owner = Object.assign({}, this.owner);
    space.skillAssessment = Object.assign({}, this.skillAssessment);
    space.stats = Object.assign({}, this.stats);
    space.updatedAt = FieldValue.serverTimestamp();
    return space;
  }

  forApp() {
    return {
      id: this.id
    };
  }
}
