import {
  db,
  defaultSuccessResult,
  functions,
  firestoreWriteTimestamp,
  frontEndURL,
  deployOptions
} from '../global';
import { error, log } from 'firebase-functions/logger';

import {
  allOfListComparator,
  notInListComparator,
  oneOfListComparator
} from '../javascript-utils';

import { ComparableQualification } from '../models/qualifications/comparable-qualification';
import { QualificationCheckResult } from '../models/qualifications/qualification-check-result';
import { saveErrorToFirestore } from '../error-utils';

import {
  SpaceVisibility,
  SpaceMembershipApplicationStatus,
  SpaceMemberRole,
  Space,
  SpaceMembershipApplication,
  SpaceMember,
  SpaceInvite
} from '@workern/models';

import { Filter, Timestamp } from 'firebase-admin/firestore';

import { Qualification } from '../models/qualifications/qualification';

import { PublicUser } from '../models/public-user';
import { Notification } from '../models/notification';

import { onCall } from 'firebase-functions/v2/https';
import { WorkHistory } from '../models/qualifications/work-history';
import { messages } from '../constants/messages';
import {
  onDocumentCreated,
  onDocumentDeleted
} from 'firebase-functions/firestore';

// exports.update = functions.https.onCall(async (data, request) => {
//   //TODO: Check if the user is the owner or editor of the space.
//   if (request.auth?.uid != null) {
//     const updatedSpace = data.space as Space;
//     const authUid = request.auth.uid;
//     if (authUid != null && updatedSpace.id != null) {
//       const spaceId = updatedSpace.id;

//       const spaceRef = db
//         .collection('users')
//         .doc(authUid)
//         .collection('mySpaces')
//         .doc(spaceId);
//       return db
//         .runTransaction(async (transaction) => {
//           const existingSpaceSnap = await transaction.get(spaceRef);
//           const existingSpace = existingSpaceSnap.data() as Space;
//           const user = (
//             await transaction.get(db.collection('users').doc(authUid))
//           ).data();
//           const member = await transaction.get(
//             spaceRef.collection('members').doc(authUid)
//           );
//           if (
//             !existingSpaceSnap.exists ||
//             existingSpace.owner.uid == authUid ||
//             (member.exists && canMemberEdit(new SpaceMember(member.data())))
//           ) {
//             if (!member.exists) {
//               log('Members are null');

//               const memberRef = spaceRef.collection('members').doc(authUid);
//               const spaceMember = new SpaceMember({
//                 id: memberRef.id,
//                 spaceId: spaceId,
//                 role: SpaceMemberRole.OWNER,
//                 joinedAt: firestoreWriteTimestamp,
//                 invite: null,
//                 info: new PublicUser(user, false),
//               });
//               log(spaceMember.forFirestore());
//               transaction.set(memberRef, spaceMember.forFirestore());
//             }
//             if (
//               (existingSpace &&
//                 isOwnerSame(existingSpace.owner, updatedSpace.owner)) ||
//               (!existingSpace && updatedSpace.owner.uid == authUid)
//             ) {
//               log(updatedSpace.forFirestore());
//               transaction.set(spaceRef, updatedSpace.forFirestore());
//             }
//           } else {
//             throw new functions.https.HttpsError(
//               'permission-denied',
//               "You don't have permission to update this space."
//             );
//           }
//         })
//         .then(() => {
//           log('Space updated successfully.');
//           return defaultSuccessResult;
//         })
//         .catch((err) => {
//           error(err);
//           throw new functions.https.HttpsError(
//             'unknown',
//             'An error occurred while creating the space.'
//           );
//         });
//     } else {
//       throw new functions.https.HttpsError(
//         'permission-denied',
//         "You don't have permission to create a space."
//       );
//     }
//   }
// });
exports.delete = onCall(deployOptions, async (request) => {
  //TODO allow space deletion only when all tasks are deleted.
  const data = request.data;
  let space = data.space as Space;
  const uid = request.auth?.uid;

  if (!space?.id || !uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid data provided to delete the space.'
    );
  }

  await deleteSpaceWithChecks(space, uid);
});

async function deleteSpaceWithChecks(space: Space, uid: string) {
  if (uid != null) {
    const hasPermission = await hasPermissionToDeleteSpace(space.id, uid);
    if (!hasPermission) {
      throw new functions.https.HttpsError(
        'permission-denied',
        "You don't have permission to delete this space."
      );
    }

    const spaceId = space.id;
    const userRef = db.collection('users').doc(uid);
    const spaceRef = userRef.collection('mySpaces').doc(spaceId);
    const user = (await userRef.get()).data();
    space = (await spaceRef.get()).data() as Space;
    if (!space) {
      throw new functions.https.HttpsError('not-found', 'Space not found.');
    }
    const tasks = await spaceRef
      .collection('tasks')
      .where('timings.publishedAt', '>', new Date(1000))
      .get();
    if (tasks.docs.length > 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Please delete all tasks before deleting the space.'
      );
    }
    const members = await db
      .collection('users')
      .doc(space.owner.uid)
      .collection('mySpaces')
      .doc(spaceId)
      .collection('members')
      .get();
    const promises = [];
    user.visibilities = user.visibilities.filter((id) => id != spaceId);
    promises.push(userRef.update({ visibilities: user.visibilities }));
    log('Members:', members.docs.length);
    members.docs.forEach(async (doc) => {
      const memberUid = doc.data().info.uid;
      log('Member UID:', memberUid);
      if (memberUid) {
        promises.push(
          db.recursiveDelete(
            db
              .collection('users')
              .doc(memberUid)
              .collection('mySpaces')
              .doc(spaceId)
          )
        );
      }
    });

    return Promise.all(promises)
      .then((result) => {})
      .catch((err) => {
        error('Error deleting space:', err);
        throw new functions.https.HttpsError(
          'unknown',
          'An error occurred while deleting thespace.'
        );
      });
  }
}

exports.onSpaceCreated = onDocumentCreated(
  { document: 'users/{uid}/mySpaces/{spaceId}' },
  async (event) => {
    const space = event.data.data() as Space;

    const uid = event.params.uid;

    const spaceId = event.params.spaceId;
    const spaceRef = db.doc(`users/${uid}/mySpaces/${spaceId}`);

    const memberRef = spaceRef.collection('members').doc(uid);
    return db
      .runTransaction(async (transaction) => {
        const user = (
          await transaction.get(db.collection('users').doc(uid))
        ).data();
        const member = {
          id: memberRef.id,
          spaceId: spaceId,
          role:
            space.owner?.uid === uid
              ? SpaceMemberRole.OWNER
              : SpaceMemberRole.MEMBER,
          joinedAt: firestoreWriteTimestamp,
          invite: null,
          info: {
            uid: user.uid,
            name: user.name || null,
            email: user.email || null,
            mobile: user.mobile || null
          }
        };
        transaction.set(memberRef, member);
        transaction.set(
          memberRef.collection('details').doc('workHistory'),
          new WorkHistory().forFirestore()
        );
        if (user.visibilities.indexOf(spaceId) == -1) {
          user.visibilities.push(spaceId);
        }

        transaction.update(db.collection('users').doc(uid), {
          visibilities: user.visibilities
        });
      })
      .then(() => {
        log('User added to spaces');
        return defaultSuccessResult;
      });
  }
);

exports.onSpaceDeleted = onDocumentDeleted(
  { document: 'users/{uid}/mySpaces/{spaceId}' },
  async (event) => {
    const spaceId = event.params.spaceId;
    const notificationsRef = await db
      .collectionGroup('notifications')
      .where('data.space.id', '==', spaceId)
      .get();
    const batch = db.batch();
    let batchSize = 0;
    notificationsRef.docs.forEach((doc) => {
      batch.delete(doc.ref);
      batchSize++;
      if (batchSize == 500) {
        batch.commit();
        batchSize = 0;
      }
    });
    return batch.commit();
  }
);

exports.createMembershipApplication = onCall(deployOptions, async (request) => {
  const data = request.data;
  log('Create qualification request function called.', data);
  const workerUid = request.auth.uid;

  const spaceId = data.spaceId;
  if (spaceId != null) {
    log('Space ID:', spaceId);

    const spaceQuery = db
      .collectionGroup('mySpaces')
      .where('id', '==', spaceId);

    const spaces = await spaceQuery.get();
    if (spaces.empty) {
      throw new functions.https.HttpsError('not-found', 'Space not found.');
    }
    const spaceDoc = spaces.docs[0];
    const space = spaceDoc.data() as Space;
    if (workerUid != null && space.visibility == SpaceVisibility.PUBLIC) {
      const worker = (await db.collection('users').doc(workerUid).get()).data();
      log('Got both worker UID and qualification.');
      const applicationRef = await spaceDoc.ref
        .collection('applications')
        .where('member.info.uid', '==', workerUid)
        .get();

      if (applicationRef.size == 0) {
        const application: SpaceMembershipApplication<Timestamp> = {};
        log('Qualification in worker ref is null');
        const batch = db.batch();
        application.id = db.collection('applications').doc().id;
        application.submittedOn = Timestamp.now();
        application.status = SpaceMembershipApplicationStatus.APPLIED;
        application.member = {
          id: workerUid,
          spaceId: spaceId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: null,
          invite: null,
          info: {
            uid: worker.uid ?? null,
            name: worker.name ?? null,
            email: worker.email ?? null,
            mobile: worker.mobile ?? null,
            rating: worker.rating ?? null
          },
          claims: null,
          tags: [],
          stats: null
        };
        batch.create(
          spaceDoc.ref.collection('applications').doc(),
          application
        );
        if (space.owner.uid != null) {
          const spaceInCreator = space as Space;
          spaceInCreator.stats.applicationsReceived++;
          batch.update(spaceDoc.ref, spaceInCreator as any);
          batch.create(
            spaceDoc.ref.collection('applications').doc(application.id),
            application
          );
        }
        batch.create(
          db.collection('applications').doc(application.id),
          application
        );

        return batch
          .commit()
          .then(() => {
            log('Applications created successfully.');
            return defaultSuccessResult;
          })
          .catch((error) => {
            saveErrorToFirestore(error);
            throw new functions.https.HttpsError(
              'unknown',
              'An error occurred while creating the qualification request.'
            );
          });
      } else {
        log('Worker has already applied for joining this space.');
        const applicationStatus = applicationRef.docs[0].data().status;
        throw new functions.https.HttpsError(
          'already-exists',
          `You have already applied for this space. ${
            applicationStatus == SpaceMembershipApplicationStatus.APPLIED
              ? 'Please wait as the application is yet to be processed by the space owner.'
              : `${
                  applicationStatus == SpaceMembershipApplicationStatus.REJECTED
                    ? 'The space owner has rejected your application.'
                    : ''
                }`
          }`
        );
      }
    } else {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Space does not accept membership requests.`
      );
    }
  } else {
    log('Qualification request is null', data.workerUid, request.auth.uid);
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Space ID is required.'
    );
  }
});

exports.invite = onCall(deployOptions, async (request) => {
  const data = request.data;
  if (
    request.auth?.uid != null &&
    [SpaceMemberRole.EDITOR, SpaceMemberRole.MEMBER].indexOf(data?.role) > -1
  ) {
    const uid: string = request.auth.uid;
    const emails: string[] = data.emails;
    const role: string = data.role;
    const spaceId: string = data.spaceId;
    const message: string = data.message;
    if (!emails || emails.length == 0 || !role || !spaceId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Emails, role and space ID are required.'
      );
    }
    const canEdit = await canEditInSpace(spaceId, uid);
    if (!canEdit) {
      throw new functions.https.HttpsError(
        'permission-denied',
        "You don't have permission to invite members."
      );
    }
    let newMembers = [];
    const spaceRef = db
      .collection('users')
      .doc(uid)
      .collection('mySpaces')
      .doc(spaceId);
    const space = (await spaceRef.get()).data() as Space;
    const membersCollection = await spaceRef.collection('members');
    const user = (await db.collection('users').doc(uid).get()).data();
    const sender = {
      uid: user.uid,
      name: user.name || null,
      email: user.email || null,
      mobile: user.mobile || null
    };
    if (!space) {
      throw new functions.https.HttpsError('not-found', 'Space not found.');
    }
    membersCollection.get().then(async (members) => {
      const memberEmails = members.docs.map(
        (member) => member.data().info.email
      );
      newMembers = emails.filter((email) => !memberEmails.includes(email));
      const batch = db.batch();
      for await (let email of newMembers) {
        const userSnaps = await db
          .collection('users')
          .where('email', '==', email)
          .get();
        const snapUser =
          userSnaps.docs.length > 0 ? userSnaps.docs[0]?.data() : null;
        const invitedUser = {
          uid: snapUser?.uid ?? null,
          name: snapUser?.name ?? null,
          email: snapUser?.email ?? null,
          mobile: snapUser?.mobile ?? null
        };

        const memberRef = membersCollection.doc();
        const member = {
          id: memberRef.id,
          spaceId: spaceId,
          role: role,
          invite: {
            sentAt: firestoreWriteTimestamp,
            sender: sender
          },
          joinedAt: null,
          info: {
            uid: invitedUser.uid ?? null,
            name: invitedUser.name ?? null,
            email: invitedUser.email ?? null,
            mobile: invitedUser.mobile ?? null
          }
        };
        batch.set(memberRef, member);
        batch.set(db.collection('mail').doc(), {
          to: [email],
          template: {
            name: 'inviteToSpace',
            data: {
              senderName: sender.name,
              senderEmail: sender.email,
              spaceName: space.title,
              message: message,
              joinUrl: `${frontEndURL}/spaces/${spaceId}`
            }
          }
        });
        if (invitedUser?.uid != null) {
          const userRef = db.collection('users').doc(invitedUser.uid);
          log('User already exists.');
          const notificationRef = userRef.collection('notifications').doc();
          batch.set(
            notificationRef,
            new Notification({
              id: notificationRef.id,
              type: 'SPACE_INVITE',
              title: 'You have been invited to a space',
              description: `You have been invited to join ${space.title} space by ${sender.email}.`,
              data: { space: { id: space.id, name: space.title } },
              receiver: invitedUser
            }).forFirestore()
          );
          const userSpaceRef = userRef.collection('mySpaces').doc(spaceId);
          batch.set(userSpaceRef, space);
        }
      }

      return batch.commit().then(() => {
        return defaultSuccessResult;
      });
    });
  }
});

exports.updateInvite = onCall(deployOptions, async (request) => {
  const data = request.data;
  log(request.data);
  if (request.auth?.uid != null) {
    const invitedUserUid: string = request.auth.uid;
    const invitedUser = (
      await db.collection('users').doc(invitedUserUid).get()
    ).data();
    const spaceId: string = data.space.id;
    const accepted: boolean = data.accepted;
    log('Space ID:', spaceId);
    log('Accepted:', accepted);
    log('invitedUserUID', invitedUserUid);
    const spaceRefInInvited = db
      .collection('users')
      .doc(invitedUserUid)
      .collection('mySpaces')
      .doc(spaceId);
    const space = (await spaceRefInInvited.get()).data() as Space;
    if (!space) {
      throw new functions.https.HttpsError('not-found', 'Space not found.');
    }
    log('Space:', space);
    const spaceRefInOwner = db
      .collection('users')
      .doc(space.owner.uid)
      .collection('mySpaces')
      .doc(spaceId);
    const members = (
      await spaceRefInOwner
        .collection('members')
        .where('info.uid', '==', invitedUserUid)
        .get()
    ).docs;
    if (members.length == 0) {
      await deleteInviteNotification(space, invitedUserUid);
      throw new functions.https.HttpsError('not-found', 'No invite found.');
    }
    const member = members[0].data();
    if (member.joinedAt != null) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You are already a member of this space.'
      );
    }
    const promises: Promise<any>[] = [
      deleteInviteNotification(space, invitedUserUid)
    ];

    if (accepted) {
      const batch = db.batch();

      batch.delete(spaceRefInOwner.collection('members').doc(member.id));
      //Don't change order of the above and below lines.
      member.id = invitedUserUid;
      member.joinedAt = firestoreWriteTimestamp;
      member.info = invitedUser;
      batch.set(
        spaceRefInOwner.collection('members').doc(invitedUserUid),
        member
      );
      batch.set(
        spaceRefInOwner
          .collection('members')
          .doc(invitedUserUid)
          .collection('details')
          .doc('workHistory'),
        new WorkHistory().forFirestore()
      );
      if (invitedUser.visibilities.indexOf(spaceId) == -1) {
        invitedUser.visibilities.push(spaceId);
      }

      batch.update(db.collection('users').doc(invitedUserUid), {
        visibilities: invitedUser.visibilities
      });
      promises.push(batch.commit());
    } else {
      promises.push(deleteMemberWork(space as Space, member.id));
    }
    return Promise.all(promises)
      .then(() => {
        return defaultSuccessResult;
      })
      .catch((error) => {
        saveErrorToFirestore(error);
        throw new functions.https.HttpsError(
          'unknown',
          'An error occurred while joining the space.'
        );
      });
  }
});

exports.deleteMember = onCall(deployOptions, async (request) => {
  const data = request.data;
  //TODO: Check if the user is the owner or editor of the space.
  if (request.auth?.uid != null) {
    const uid: string = request.auth?.uid;
    const spaceId: string = data.spaceId;

    const memberId: string = data.id;

    if (!spaceId || !memberId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Please provide required data to delete a member.'
      );
    }
    const canEdit = await canEditInSpace(spaceId, uid);
    if (!canEdit) {
      throw new functions.https.HttpsError(
        'permission-denied',
        "You don't have permission to delete a member."
      );
    }

    const space = (
      await db
        .collection('users')
        .doc(uid)
        .collection('mySpaces')
        .doc(spaceId)
        .get()
    ).data();

    return deleteMemberWork(space as Space, memberId);
  } else {
    throw new functions.https.HttpsError(
      'permission-denied',
      "You don't have permission to delete a member."
    );
  }
});

export async function isUserQualified(
  qualifications: {
    linkingOperator: string;
    groups: {
      [key: string]: {
        linkingOperator: string;
        qualifications: ComparableQualification[];
      };
    };
    IDs: string[];
    isQualified?: boolean;
  },
  uid: string,
  langCode = 'en'
) {
  if (qualifications != null) {
    const userQualifications = (
      await Promise.all(
        qualifications.IDs.map((id) =>
          db
            .collection('users')
            .doc(uid)
            .collection('qualifications')
            .doc(id)
            .get()
        )
      )
    ).reduce((acc, snap) => {
      if (snap.exists) {
        acc[snap.id] = snap.data();
      }
      return acc;
    }, {});

    if (qualifications.IDs.some((qual) => userQualifications[qual] == null)) {
      throw new functions.https.HttpsError(
        'not-found',
        messages[langCode].qualifications.notExistsForUser,
        {
          qualificationsNotFound: qualifications.IDs.filter(
            (qual) => userQualifications[qual] == null
          )
        }
      );
    }

    let isUserQualified: boolean = true;
    const mainLinkingOperator = qualifications.linkingOperator;
    const failedQuals = [];
    for (var key in qualifications.groups) {
      const qualGroup = qualifications.groups[key];
      const qualGroupLinkingOperator = qualGroup.linkingOperator;
      let groupPass;
      if (qualGroupLinkingOperator) {
        const quals: QualificationCheckResult[] = qualGroup.qualifications.map(
          (qual) => new QualificationCheckResult(qual)
        );
        log('Qualifications:', quals);
        for (let i = 0; i < quals.length; i++) {
          const qual: QualificationCheckResult = quals[
            i
          ] as QualificationCheckResult;
          const workerValue = userQualifications[qual.id]?.value;
          const benchmarkValue = qual.value;
          log('Worker Value:', workerValue);
          log('Benchmark Value:', benchmarkValue);
          let qualPass: boolean = false;

          switch (qual.comparator.value) {
            case 'ALL_OF_LIST':
              qualPass = allOfListComparator(
                benchmarkValue as any[],
                workerValue
              );
              break;
            case 'ONE_OF_LIST':
              qualPass = oneOfListComparator(
                benchmarkValue as any[],
                workerValue
              );
              break;
            case 'NOT_IN_LIST':
              qualPass = notInListComparator(
                benchmarkValue as any[],
                workerValue
              );
              break;
            case 'GREATER_THAN':
              qualPass = workerValue > benchmarkValue;
              break;
            case 'GREATER_THAN_EQUAL_TO':
              qualPass = workerValue >= benchmarkValue;
              break;
            case 'LESS_THAN':
              qualPass = workerValue < benchmarkValue || workerValue == null;
              break;
            case 'LESS_THAN_EQUAL_TO':
              qualPass = workerValue <= benchmarkValue || workerValue == null;
              break;
            case 'EQUAL_TO':
              qualPass = workerValue == benchmarkValue;
              break;
            case 'CONTAINS':
              qualPass = (benchmarkValue as string).includes(workerValue);
              break;
            case 'NOT_CONTAINS':
              qualPass = !(benchmarkValue as string).includes(workerValue);
              break;
            default:
              qualPass = false;
          }
          log(`passed qualification-${qual.id}:`, qualPass);
          qual.isQualified = qualPass;
          if (!qualPass) {
            failedQuals.push(qual);
          }
        }
        groupPass =
          qualGroupLinkingOperator == 'AND'
            ? quals.every((qual) => qual.isQualified)
            : quals.some((qual) => qual.isQualified);
      } else {
        groupPass = false;
      }
      log(`passed qualification group-${key}:`, groupPass);
      switch (mainLinkingOperator) {
        case 'AND':
          if (!groupPass) {
            log('User is not qualified for this task.');
            isUserQualified = false;
          }
          break;
        case 'OR':
          if (groupPass) {
            log('User is qualified for this task.');
            isUserQualified = true;
          }
      }
    }
    if (mainLinkingOperator == 'AND' && isUserQualified == null) {
      isUserQualified = true;
    } else if (mainLinkingOperator == 'OR' && isUserQualified == null) {
      isUserQualified = false;
    }
    if (isUserQualified) {
      return Promise.resolve(isUserQualified);
    } else {
      throw new functions.https.HttpsError(
        'failed-precondition',
        messages[langCode].qualifications.notQualified,
        { failedQuals: failedQuals }
      );
    }
  } else {
    log('No qualifications found for this task.');
    return Promise.resolve(true);
  }
}

function passesQualificationSanityCheck(qual: Qualification) {
  return (
    ['string', 'number', 'boolean', 'object'].indexOf(qual.valueType) > -1 &&
    ['VALUE_BASED', 'LIST_BASED', 'BOOLEAN_BASED'].indexOf(
      qual.comparatorType
    ) > -1 &&
    typeof qual.uiName == 'string' &&
    typeof qual.id == 'string' &&
    typeof qual.owner.uid == 'string' &&
    typeof qual.description == 'string'
  );
}

export function getSpaceMember(spaceId: string, uid: string) {
  return db
    .collectionGroup('members')
    .where('info.uid', '==', uid)
    .where('spaceId', '==', spaceId)
    .get()
    .then((snaps) => {
      if (snaps.docs.length > 0) {
        const spaceMember = snaps.docs[0].data() as SpaceMember;
        return Promise.resolve(spaceMember);
      } else {
        return Promise.reject(null);
      }
    })
    .catch((err) => {
      error(err.message);
      return Promise.reject(null);
    });
}

export function canEditInSpace(spaceId: string, uid: string) {
  return getSpaceMember(spaceId, uid)
    .then((member) => {
      return canMemberEdit(member);
    })
    .catch(() => {
      return Promise.resolve(false);
    });
}

export function isSpaceMember(spaceId: string, uid: string) {
  return getSpaceMember(spaceId, uid)
    .then((member) => {
      return Promise.resolve(isSpaceMemberUsingRole(member.role));
    })
    .catch((e) => {
      log('Caught an error while getting space', e?.message);
      return Promise.resolve(false);
    });
}

export function isSpaceMemberUsingRole(role: SpaceMemberRole) {
  return (
    role == SpaceMemberRole.EDITOR ||
    role == SpaceMemberRole.MEMBER ||
    role == SpaceMemberRole.OWNER
  );
}

function canMemberEdit(member: SpaceMember) {
  return Promise.resolve(
    member.joinedAt != null
      ? [SpaceMemberRole.EDITOR, SpaceMemberRole.OWNER].indexOf(
          member.role as SpaceMemberRole
        ) > -1
      : false
  );
}

function hasPermissionToDeleteSpace(spaceId: string, uid: string) {
  return db
    .collection('users')
    .doc(uid)
    .collection('mySpaces')
    .doc(spaceId)
    .get()
    .then((snap) => {
      if (snap.exists) {
        const space = snap.data() as Space;
        return space.owner.uid == uid;
      } else {
        return Promise.resolve(false);
      }
    });
}

export function getSpaceSnapshot(spaceId: string, memberUID: string) {
  return db
    .collection('users')
    .doc(memberUID)
    .collection('mySpaces')
    .doc(spaceId)
    .get()
    .then((snap) => {
      if (snap.exists) {
        return Promise.resolve(snap);
      } else {
        return Promise.reject(null);
      }
    })
    .catch((err) => {
      error(err.message);
      return Promise.reject(null);
    });
}

export function getSpace(spaceId: string, memberUID: string) {
  return getSpaceSnapshot(spaceId, memberUID)
    .then((snap) => {
      if (snap) {
        return Promise.resolve(snap.data() as Space);
      } else {
        return Promise.reject(null);
      }
    })
    .catch((err) => {
      error(err.message);
      return Promise.reject(null);
    });
}

export function getSpaceOwnerUID(spaceId: string, memberUID: string) {
  return getSpace(spaceId, memberUID).then((space) => {
    return Promise.resolve(space?.owner?.uid);
  });
}

export async function deleteMemberWork(space: Space, memberId: string) {
  const membersRef = db
    .collection('users')
    .doc(space.owner.uid)
    .collection('mySpaces')
    .doc(space.id)
    .collection('members');
  const memberRef = membersRef.doc(memberId);
  const members = (await membersRef.get()).docs.map((doc) => doc.data());
  const memberToDelete = members.find((m) => m.id == memberId);

  if (!memberToDelete) {
    throw new functions.https.HttpsError('not-found', 'Member not found.');
  }

  if (memberToDelete.info.uid == space.owner.uid && members.length > 1) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Owner cannot be deleted from the space.'
    );
  }
  const batch = db.batch();

  batch.delete(memberRef);
  if (memberToDelete.info.uid) {
    const notificationsRef = db
      .collection('users')
      .doc(memberToDelete.info.uid)
      .collection('notifications')
      .where('data.space.id', '==', space.id);
    const notifications = await notificationsRef.get();
    log('Notifications:', notifications.docs.length);
    notifications.forEach((notification) => {
      batch.delete(notification.ref);
    });
    batch.delete(
      db
        .collection('users')
        .doc(memberToDelete.info.uid)
        .collection('mySpaces')
        .doc(space.id)
    );
  }

  return batch
    .commit()
    .then(() => {
      log('Deleted notifications and space ref in non-owner user.');
      return defaultSuccessResult;
    })
    .catch((error) => {
      saveErrorToFirestore(error);
      throw new functions.https.HttpsError(
        'unknown',
        'An error occurred while deleting the member.'
      );
    });
}

async function deleteInviteNotification(space: Space, uid: string) {
  const notificationsRef = db
    .collection('users')
    .doc(uid)
    .collection('notifications')
    .where('data.space.id', '==', space.id)
    .where('type', '==', 'SPACE_INVITE');
  const notifications = await notificationsRef.get();
  log('Notifications:', notifications.docs.length);
  const batch = db.batch();
  notifications.forEach((notification) => {
    batch.delete(notification.ref);
  });
  return batch.commit();
}

function isOwnerSame(existing: PublicUser, updated: PublicUser) {
  return (
    existing.uid == updated.uid &&
    existing.email == updated.email &&
    existing.name == updated.name &&
    existing.rating.publisher == updated.rating.publisher &&
    existing.rating.worker == updated.rating.worker
  );
}
//TODO: Check if a qualification is being used in a project before updating it. If it is being used don't update it.
