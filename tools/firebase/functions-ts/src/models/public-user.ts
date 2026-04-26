import { UserRating } from './user-rating';

export interface PublicUser {
  uid: string;
  name?: string;
  rating?: UserRating;
  email?: string;
  mobile?: string;
}
