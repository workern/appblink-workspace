export interface Base<T = Date> {
  id: string;
  createdAt: T;
  updatedAt: T;
  owner: { uid: string; name: string; photoUrl?: string };
  space: { id: string };
}
