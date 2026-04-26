import { log } from 'firebase-functions/logger';
import { admin, db } from './global';
export function getAutoId() {
  return db.collection('users').doc().id;
}

export function getDataFromMultipleRefs(
  refs,
  receiveSnapshots: boolean = false
) {
  const promises = [];
  refs.forEach((ref) => {
    promises.push(
      ref
        .once('value')
        .then((snapshot) =>
          Promise.resolve(receiveSnapshots ? snapshot : snapshot.val())
        )
    );
  });
  return Promise.all(promises).then((results: any[]) =>
    Promise.resolve(results)
  );
}

export async function getUser(uid: string) {
  return (await db.collection('users').doc(uid).get()).data();
}

export function getUserClaims(uid: string): Promise<any> {
  return admin
    .auth()
    .getUser(uid)
    .then((userRecord) => {
      return userRecord.customClaims || {};
    });
}

export async function getUserClaimsByRequest(req, res): Promise<any> {
  const authHeader = (await req.headers.authorization) || '';
  const match = authHeader.match(/^Bearer (.*)$/);

  if (!match) {
    res.status(401).send('Unauthorized');
    return;
  }

  const idToken = match[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
}
