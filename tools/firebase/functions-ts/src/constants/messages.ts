export const messages = {
  en: {
    general: {
      incorrectDataSent: 'Incorrect data sent.',
      unAuthorized: 'You are not authorized to perform this action.'
    },
    task: {
      notExists: 'Task does not exist.',
      invalidArgumentsProvided: 'Invalid arguments provided.'
    },
    offering: {
      alreadyApproved: 'Offering already approved.',
      notExists: 'Offering does not exist.',
      successfullyReviewed: `Successfully reviewed {{success}}/{{total}} offerings.`
    },
    space: {
      notExists: 'Space does not exist.'
    },
    qualifications: {
      notQualified: 'You are not qualified for this task.',
      notExistsForUser: 'Qualification does not exist for user.'
    },
    order: {
      errorCreating: 'Error creating order.'
    },
    transaction: {
      successMessage: 'Transaction successful'
    },
    application: {
      notFound: 'Application not found.',
      notCompletedRound: 'The applicant has not completed this round yet.',
      successfullySubmitted:
        'Your application has been submitted successfully.',
      updatedScoreSuccessfully: 'Score updated successfully.',
      updatedStateSuccessfully: 'State updated successfully.'
    },
    interviews: {
      notFound: 'Interview not found.',
      incorrectState: 'Incorrect Interview State',
      alreadyPublished: 'Interview already published',
      noRoundFound: 'No round found in Interview.',
      roundNotReady: 'One or more rounds are not ready for publish.',
      failedToDelete: 'Failed to delete the Interview.',
      submittedRoundNotFound: 'Submitted round not found.',
      alreadySubmittedForRound:
        'You have already submitted this round of the interview.',
      notAcceptingApplications:
        'This Interview is not accepting applications currently.',
      deletedSuccessfully: 'Interview deleted successfully.'
    },
    checkInApp: {
      appNotFound: 'App not found.',
      alreadyPublished: 'App already published.',
      successfulPublish: 'App published successfully.',
      successfulCheckout: 'Check-out successful',
      successfulCheckin: 'Check-in successful',
      alreadyCheckedIn: 'Visitor already checked in',
      visitorNotFound: 'Visitor not found',
      visitorCheckedOut: 'Visitor checked out successfully',
      alreadyCheckedOut: 'Visitor already checked out',
      notAcceptingCheckins: 'This owner is not accepting check-ins currently.',
      notAcceptingCheckouts:
        'This owner is not accepting check-outs currently.',
      visitNotFound: 'Incorrect Visit ID.',
      notCheckedIn: 'Visitor not checked in. Cannot check out.',
      notAllowedToDeleteVisit: 'This app is not accepting visit deletes.',
      visitorsDeleted: 'Visitors deleted successfully.',
      visitRequestCreated: 'Visit request created successfully.',
      appDeleted: 'App deleted successfully.',
      multipleCheckinsNotAllowed: 'Multiple check-ins not allowed.',
      incorrectVisitorState: 'Incorrect visitor state provided.'
    }
  }
};
