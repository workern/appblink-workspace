/**
 * Type-safe translation key constants for the shared components library.
 *
 * Usage (with namespaced loader — keys live under the "components" namespace):
 *
 *   import { C } from '@workern/components';
 *   // template: {{ C.AUTH.CONTINUE_WITH_GOOGLE | translate }}
 *   //        → 'components.auth.continueWithGoogle'
 *
 * This avoids magic strings scattered across templates and gives you
 * autocomplete + rename refactoring in the IDE.
 */
export const C = {
  AUTH: {
    CONTINUE_WITH_GOOGLE: 'components.auth.continueWithGoogle',
    CONTINUE_WITH_PHONE: 'components.auth.continueWithPhone',
    CONTINUE_WITH_EMAIL: 'components.auth.continueWithEmail',
    SIGNING_IN: 'components.auth.signingIn',
    VERIFICATION_CODE: 'components.auth.verificationCode',
    VERIFICATION_CODE_PLACEHOLDER:
      'components.auth.verificationCodePlaceholder',
    PHONE_NUMBER: 'components.auth.phoneNumber',
    PHONE_NUMBER_PLACEHOLDER: 'components.auth.phoneNumberPlaceholder',
    FULL_NAME: 'components.auth.fullName',
    FULL_NAME_PLACEHOLDER: 'components.auth.fullNamePlaceholder',
    FULL_NAME_REQUIRED: 'components.auth.fullNameRequired',
    EMAIL: 'components.auth.email',
    EMAIL_PLACEHOLDER: 'components.auth.emailPlaceholder',
    PASSWORD: 'components.auth.password',
    TERMS_OF_SERVICE: 'components.auth.termsOfService',
    PRIVACY_POLICY: 'components.auth.privacyPolicy',
    BACK: 'components.auth.back',
    RESEND_CODE: 'components.auth.resendCode'
  },
  BILLING: {
    TITLE: 'components.billing.title',
    YOUR_SUBSCRIPTION: 'components.billing.yourSubscription',
    CURRENT_PLAN: 'components.billing.currentPlan',
    CURRENT_PERIOD: 'components.billing.currentPeriod',
    NEXT_CHARGE: 'components.billing.nextCharge',
    CYCLES: 'components.billing.cycles',
    CHOOSE_YOUR_PLAN: 'components.billing.chooseYourPlan',
    NO_ACTIVE_SUBSCRIPTION: 'components.billing.noActiveSubscription',
    SUBSCRIBE_PROMPT: 'components.billing.subscribePrompt',
    BILLING_HISTORY: 'components.billing.billingHistory',
    NO_BILLING_HISTORY: 'components.billing.noBillingHistory',
    PROCESSING_PAYMENT: 'components.billing.processingPayment',
    PROCESSING_MSG: 'components.billing.processingMsg',
    CANCEL_RENEWAL: 'components.billing.cancelRenewal',
    CURRENT_PLAN_GLANCE: 'components.billing.currentPlanGlance'
  },
  COMMON: {
    OK: 'components.common.ok',
    CANCEL: 'components.common.cancel',
    SAVE: 'components.common.save',
    CLOSE: 'components.common.close',
    BACK: 'components.common.back',
    NEXT: 'components.common.next',
    DONE: 'components.common.done',
    LATER: 'components.common.later',
    UPDATE_NOW: 'components.common.updateNow',
    LOADING: 'components.common.loading',
    ERROR: 'components.common.error',
    SUCCESS: 'components.common.success',
    RETRY: 'components.common.retry',
    DISMISS: 'components.common.dismiss',
    SEARCH: 'components.common.search',
    ADD: 'components.common.add',
    EDIT: 'components.common.edit',
    DELETE: 'components.common.delete',
    REMOVE: 'components.common.remove',
    ADD_ITEM: 'components.common.addItem',
    REMOVE_ITEM: 'components.common.removeItem'
  },
  MEDIA: {
    ITEM_IMAGES: 'components.media.itemImages',
    CLICK_TO_UPLOAD: 'components.media.clickToUpload',
    FILE_TYPES: 'components.media.fileTypes',
    MAX_UPLOADED: 'components.media.maxUploaded',
    REMOVE_TO_ADD: 'components.media.removeToAdd'
  },
  UI: {
    APP_STORE: 'components.ui.appStore',
    GOOGLE_PLAY: 'components.ui.googlePlay',
    INSTALL_APP_LINKS: 'components.ui.installAppLinks'
  },
  UPDATE: {
    TITLE: 'components.update.title',
    DISMISS_NOTIFICATION: 'components.update.dismissNotification',
    UPDATE_LATER: 'components.update.updateLater',
    UPDATE_NOW: 'components.update.updateNow'
  }
} as const;
