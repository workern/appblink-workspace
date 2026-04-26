import { db } from './global';

export function saveErrorToFirestore(error: any) {
  return db
    .collection('cloudFunctionsErrors')
    .add(error)
    .then((ref) => {
      return Promise.resolve(ref.id);
    });
}
