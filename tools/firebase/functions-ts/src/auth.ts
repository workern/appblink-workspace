import { log } from 'firebase-functions/logger';
import { functions, db, admin, usingEmulator } from './global';
import { FieldValue } from 'firebase-admin/firestore';
import { acceptPendingInvitesForUser } from './workspaces/accept-invite';
import { z } from 'zod';
import { HttpsError, onCall, onRequest } from 'firebase-functions/https';
import { getUserClaims } from './firebase-utils';
/**
 * Creates a new user document and initializes their workspace when they sign up
 * Sets up default spaces, work history, qualifications, and app-specific configurations
 */
exports.writeNewUserToFirestore = functions.auth
  .user()
  .onCreate(async function (userRecord, context) {
    // ============================================================
    // Extract user information
    // ============================================================
    const uid = userRecord.uid;
    const name = userRecord.displayName || '';
    const phoneNumber = userRecord.phoneNumber;
    const email = userRecord.email || '';

    // const owner = {
    //   uid,
    //   name,
    //   email: email || null,
    //   mobile: phoneNumber || null
    // };

    // ============================================================
    // Initialize references
    // ============================================================
    const userRef = db.collection('users').doc(uid);

    // ============================================================
    // Prepare user data
    // ============================================================
    const userData = {
      uid,
      name,
      email,
      phoneNumber,
      mobile: phoneNumber ?? null,
      photoURL: userRecord.photoURL || '',
      balance: 0.0,
      paypalEmail: '',
      currency: 'USD',
      rating: { publisher: 0, worker: 0 },
      visibilities: ['PUBLIC', email, uid],
      createdAt: FieldValue.serverTimestamp()
    };

    // ============================================================
    // Initialize batch operations
    // ============================================================
    const batch = db.batch();
    const promises: Promise<any>[] = [];
    batch.set(userRef, userData);
    // // ============================================================
    // // Set up work history and qualifications
    // // ============================================================
    // const workHistory = new WorkHistory();
    // batch.set(
    //   userRef.collection('details').doc('workHistory'),
    //   workHistory.forFirestore()
    // );

    // Object.keys(workHistory).forEach((key) => {
    //   batch.set(
    //     userRef.collection('qualifications').doc(key),
    //     new UserQualification({
    //       id: key,
    //       value: key === 'approvalRate' ? 100 : 0,
    //       group: 'workHistory',
    //       valueType: 'number'
    //     }).forFirestore()
    //   );
    // });

    // ============================================================
    // Set up user documents
    // ============================================================

    // batch.set(db.collection('usersPublicData').doc(uid), {
    //   uid,
    //   name: name || null,
    //   rating: { publisher: 0, worker: 0 }
    // });

    // ============================================================
    // Commit batch and handle phone number verification
    // ============================================================
    // promises.push(
    //   batch.commit().then(() => {
    //     if (!phoneNumber) return Promise.resolve();

    //     try {
    //       const phoneUtil =
    //         require('google-libphonenumber').PhoneNumberUtil.getInstance();
    //       const number = phoneUtil.parseAndKeepRawInput(phoneNumber);
    //       const regionCode = phoneUtil.getRegionCodeForNumber(number);

    //       if (regionCode) {
    //         return rtdb
    //           .ref('users')
    //           .child(uid)
    //           .child('qualifications')
    //           .child('verifiedMobileNumberCountry')
    //           .set(regionCode);
    //       }
    //     } catch (error) {
    //       log('Error parsing phone number:', error);
    //     }

    //     return Promise.resolve();
    //   })
    // );

    promises.push(
      acceptPendingInvitesForUser(
        uid,
        email,
        userRecord.displayName ?? null,
        userRecord.photoURL ?? null,
        userRecord.phoneNumber ?? null
      ).catch((err) =>
        log('[teams] acceptPendingInvitesForUser error:', err?.message)
      )
    );

    // ============================================================
    // Execute all promises and complete user creation
    // ============================================================
    return Promise.all(promises).then(() => {
      log(`✅ User created successfully: ${uid}`);
    });
  });

exports.onUserDeleted = functions.auth
  .user()
  .onDelete((userRecord, context) => {
    const uid = userRecord.uid;
    const promises = [];
    promises.push(db.recursiveDelete(db.collection('users').doc(uid)));
    promises.push(db.collection('usersPublicData').doc(uid).delete());
    promises.push(db.collection('userClaims').doc(uid).delete());
    // promises.push(
    //   db
    //     .collectionGroup('members')
    //     .where('info.uid', '==', uid)
    //     .get()
    //     .then(async (snaps) => {
    //       if (!snaps.empty) {
    //         const subPromises = [];
    //         snaps.forEach(async (snap) => {
    //           subPromises.push(
    //             snap.ref.parent.parent.get().then(async (spaceSnap) => {
    //               return deleteMemberWork(
    //                 spaceSnap.data() as Space<Date>,
    //                 snap.ref.id
    //               );
    //             })
    //           );
    //         });
    //         return Promise.all(subPromises);
    //       }
    //     })
    // );
    return Promise.all(promises)
      .then(() => {
        log('User deleted!');
      })
      .catch((error) => {
        log('Error deleting user data', error);
      });
  });

// Zod schema for validating request body
const updateUserClaimsSchema = z.object({
  uid: z.string(),
  claims: z.any()
});

// Firebase function to update user claims
export const updateUserClaims = onCall(async (req) => {
  const userClaims = await getUserClaims(req.auth?.uid || '');
  const allowUpdatingClaims = userClaims.admin || usingEmulator;
  if (!allowUpdatingClaims) {
    throw new HttpsError(
      'permission-denied',
      'Not authorized to update claims'
    );
  }

  try {
    // Validate request body
    const { uid, claims } = updateUserClaimsSchema.parse(req.data);
    const user = await admin.auth().getUser(uid);
    if (!user) {
      throw new HttpsError('not-found', 'User not found');
    }

    // Update user claims
    await admin.auth().setCustomUserClaims(uid, claims);

    return Promise.resolve({
      message: 'User claims updated successfully',
      success: true
    });
  } catch (error) {
    throw new HttpsError('invalid-argument', 'Invalid request data');
  }
});

export const updateUserClaimsOnRequest = onRequest(async (req, res) => {
  if (!req.body.shambho) {
    res.status(403).send({ error: 'Forbidden' });
    return;
  }
  try {
    // Validate request body
    const { uid, claims } = updateUserClaimsSchema.parse(req.body);
    const user = await admin.auth().getUser(uid);
    if (!user) {
      throw new HttpsError('not-found', 'User not found');
    }
    // Update user claims
    await admin.auth().setCustomUserClaims(uid, claims);
    res.send({
      message: 'User claims updated successfully',
      success: true
    });
  } catch (error) {
    res.status(400).send({ error: 'Invalid request data' });
    throw new HttpsError('invalid-argument', 'Invalid request data');
  }
});

export function authenticateOnCall(uid: string, context) {
  return context.auth?.uid === uid;
}

// Authentication Middleware
const unauthorized = (res, message = 'Unauthorized') => {
  res.status(401).send({ error: message });
};

export const authenticateOnRequest = (req, res, next) => {
  const { authorization } = req.headers;
  const apiKey = req.query.apiKey;

  if (apiKey) {
    log('Authenticating using API Key');
    authenticateWithApiKey(apiKey, req, res, next);
  } else if (authorization && authorization.startsWith('Bearer ')) {
    log('Authenticating using Bearer Token');
    authenticateWithBearerToken(req, res, next);
  } else {
    unauthorized(res);
  }
};

const authenticateWithApiKey = (apiKey, req, res, next) => {
  db.collection('usersByApiKey')
    .doc(apiKey)
    .get()
    .then((snap) => {
      if (snap.exists && snap.data()?.valid) {
        req.user = { uid: snap.data().uid };
        next(req, res);
      } else {
        unauthorized(res, 'Invalid API Key');
      }
    })
    .catch((error) => handleError(error, res));
};

const authenticateWithBearerToken = (req, res, next) => {
  const { authorization } = req.headers;
  const idToken = authorization.split('Bearer ')[1];
  return admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      log('Decoded Token', decodedToken);
      req.user = { uid: decodedToken.uid };
      next(req, res);
    })
    .catch((error) => unauthorized(res));
};

const handleError = (error, res, message = 'Operation failed') => {
  log(`Error: ${message}`, { error: JSON.stringify(error) });
  res.status(500).send({ error: message });
};
