import { Base } from './base.model';
export interface UserAddress<T = Date> extends Base<T> {
  type: 'Home' | 'Work' | 'Other';
  name: string;
  mobile: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  formatted: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
    geoHash: string;
  };
}
