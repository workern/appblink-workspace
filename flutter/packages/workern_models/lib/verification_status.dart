/// Verification status enum
enum VerificationStatus {
  pending,
  verified,
  rejected,
  notStarted;

  /// Convert from string (database format)
  static VerificationStatus fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'verified':
        return VerificationStatus.verified;
      case 'rejected':
        return VerificationStatus.rejected;
      case 'not_started':
        return VerificationStatus.notStarted;
      case 'pending':
      default:
        return VerificationStatus.pending;
    }
  }

  /// Convert to string (database format)
  String toDbString() {
    switch (this) {
      case VerificationStatus.verified:
        return 'verified';
      case VerificationStatus.rejected:
        return 'rejected';
      case VerificationStatus.notStarted:
        return 'not_started';
      case VerificationStatus.pending:
        return 'pending';
    }
  }
}
