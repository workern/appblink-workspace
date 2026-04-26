import 'return_exchange_policy.dart';

/// Terms and conditions for shop
class TermsAndConditions {
  final ReturnExchangePolicy returns;
  final ReturnExchangePolicy exchange;

  TermsAndConditions({required this.returns, required this.exchange});

  factory TermsAndConditions.fromJson(Map<String, dynamic> json) =>
      TermsAndConditions(
        returns: ReturnExchangePolicy.fromJson(json['returns'] ?? {}),
        exchange: ReturnExchangePolicy.fromJson(json['exchange'] ?? {}),
      );

  Map<String, dynamic> toJson() => {
    'returns': returns.toJson(),
    'exchange': exchange.toJson(),
  };
}
