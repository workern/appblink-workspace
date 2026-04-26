/// Amount with currency information
class Amount {
  final double value;
  final String currency;
  final String symbol;

  Amount({required this.value, required this.currency, required this.symbol});

  factory Amount.fromJson(Map<String, dynamic> json) {
    return Amount(
      value: (json['value'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] ?? 'INR',
      symbol: json['symbol'] ?? '₹',
    );
  }

  Map<String, dynamic> toJson() {
    return {'value': value, 'currency': currency, 'symbol': symbol};
  }

  @override
  String toString() => '$symbol${value.toStringAsFixed(2)}';

  /// Format amount for display
  String format({int decimals = 2}) =>
      '$symbol${(value / 100.0).toStringAsFixed(decimals)}';
  String formatOnlyValue({int decimals = 2}) =>
      (value / 100.0).toStringAsFixed(decimals);
}
