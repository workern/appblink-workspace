import { https } from 'firebase-functions/v2';
import { messages } from '../constants/messages';

import { error, log } from 'firebase-functions/logger';
import { CallableRequest } from 'firebase-functions/https';

export async function checkRequest(
  request: CallableRequest,
  schema,
  onlyAuth = true
) {
  const langCode = request.data?.lang || 'en';
  const errorMessages = messages[langCode];
  const spaceId = request.data?.spaceId;
  if (!request.auth?.uid && onlyAuth) {
    throw new https.HttpsError(
      'unauthenticated',
      errorMessages.general.unAuthorized
    );
  }
  const issues = schema.safeParse(request.data).error?.issues;
  if (issues) {
    log('issues with sent data in checkRequest', issues);
  }

  if (!schema.safeParse(request.data)) {
    throw new https.HttpsError(
      'invalid-argument',
      errorMessages.general.incorrectDataSent
    );
  }
  // if (spaceId != null) {
  //   const isMember = await isSpaceMember(spaceId, request.auth.uid);
  //   log('isMember', isMember);
  //   if (!isMember) {
  //     throw new https.HttpsError(
  //       'permission-denied',
  //       errorMessages.general.unAuthorized
  //     );
  //   }
  // }

  return true;
}
