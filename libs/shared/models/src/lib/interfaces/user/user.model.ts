import { UserAddress } from './user-address';

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  addresses?: UserAddress[];
  mobile: string;
}
