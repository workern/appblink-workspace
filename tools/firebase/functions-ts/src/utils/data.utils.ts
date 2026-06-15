import { https } from 'firebase-functions/v2';
import { messages } from '../constants/messages';
import { log } from 'firebase-functions/logger';
import { CallableRequest } from 'firebase-functions/https';

export async function checkRequest(
  request: CallableRequest,
  schema,
  onlyAuth = true
) {
  const langCode = request.data?.lang || 'en';
  const errorMessages = messages[langCode];

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

  // Note: workspace/space membership authorization is the responsibility of
  // the calling function. Use isWorkspaceMember() from workspaces/core.ts.

  return true;
}
