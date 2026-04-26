/// Return/exchange policy for shop
class ReturnExchangePolicy {
  final int days;
  final bool notAllowed;

  ReturnExchangePolicy({required this.days, this.notAllowed = false});

  factory ReturnExchangePolicy.fromJson(Map<String, dynamic> json) =>
      ReturnExchangePolicy(
        days: json['days'] ?? 30,
        notAllowed: json['notAllowed'] ?? false,
      );

  Map<String, dynamic> toJson() => {'days': days, 'notAllowed': notAllowed};
}
