enum TransactionProcessorID {
  razorpay,
  stripe,
  paypal,
  paytm,
  razorpayx,
  lemonSqueezy,
  dodoPayments,
  playStore,
  appStore,
}

extension TransactionProcessorIDX on TransactionProcessorID {
  String get value {
    switch (this) {
      case TransactionProcessorID.razorpay:
        return 'RAZORPAY';
      case TransactionProcessorID.stripe:
        return 'STRIPE';
      case TransactionProcessorID.paypal:
        return 'PAYPAL';
      case TransactionProcessorID.paytm:
        return 'PAYTM';
      case TransactionProcessorID.razorpayx:
        return 'RAZORPAYX';
      case TransactionProcessorID.lemonSqueezy:
        return 'LEMON_SQUEEZY';
      case TransactionProcessorID.dodoPayments:
        return 'DODO_PAYMENTS';
      case TransactionProcessorID.playStore:
        return 'PLAY_STORE';
      case TransactionProcessorID.appStore:
        return 'APP_STORE';
    }
  }

  static TransactionProcessorID fromValue(String value) {
    return TransactionProcessorID.values.firstWhere(
      (gateway) => gateway.value == value,
      orElse: () => TransactionProcessorID.razorpay,
    );
  }
}
