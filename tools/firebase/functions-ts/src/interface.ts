export interface PublicUser {
  uid: string;
  name?: string;
  rating?: UserRatingInterface;
  email?: string;
}
export type PublicUserInterface = PublicUser;
export interface WorkernCallableFunctionResponse {
  data: { successful: string; message: string };
}

export interface UserRatingInterface {
  publisher: number;
  worker: number;
}
