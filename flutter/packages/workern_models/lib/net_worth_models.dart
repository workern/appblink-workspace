import 'amount.dart';

// Search source for stock/mutual fund lookups
enum SearchSource {
  yahoo,
  groww,
  mfapi;

  String toJson() {
    switch (this) {
      case SearchSource.yahoo:
        return 'yahoo';
      case SearchSource.groww:
        return 'groww';
      case SearchSource.mfapi:
        return 'mfapi';
    }
  }

  static SearchSource fromJson(String json) {
    switch (json) {
      case 'yahoo':
        return SearchSource.yahoo;
      case 'groww':
        return SearchSource.groww;
      case 'mfapi':
        return SearchSource.mfapi;
      default:
        return SearchSource.yahoo;
    }
  }
}

// Asset types supported in the net worth calculator
enum AssetType {
  stock,
  crypto,
  realEstate,
  cash,
  bond,
  mutualFund,
  etf,
  commodity,
  other;

  String toJson() {
    switch (this) {
      case AssetType.stock:
        return 'stock';
      case AssetType.crypto:
        return 'crypto';
      case AssetType.realEstate:
        return 'real_estate';
      case AssetType.cash:
        return 'cash';
      case AssetType.bond:
        return 'bond';
      case AssetType.mutualFund:
        return 'mutual_fund';
      case AssetType.etf:
        return 'etf';
      case AssetType.commodity:
        return 'commodity';
      case AssetType.other:
        return 'other';
    }
  }

  static AssetType fromJson(String json) {
    switch (json) {
      case 'stock':
        return AssetType.stock;
      case 'crypto':
        return AssetType.crypto;
      case 'real_estate':
        return AssetType.realEstate;
      case 'cash':
        return AssetType.cash;
      case 'bond':
        return AssetType.bond;
      case 'mutual_fund':
        return AssetType.mutualFund;
      case 'etf':
        return AssetType.etf;
      case 'commodity':
        return AssetType.commodity;
      case 'other':
      default:
        return AssetType.other;
    }
  }
}

// Stock holding with market data
class StockHolding {
  final String id;
  final String symbol;
  final String? name;
  final double quantity;
  final Amount averageCostPerShare;
  final Amount? currentPrice;
  final Amount? currentValue;
  final Amount totalCost;
  final Amount? gainLoss;
  final double? gainLossPercentage;
  final int? lastUpdated;

  StockHolding({
    required this.id,
    required this.symbol,
    this.name,
    required this.quantity,
    required this.averageCostPerShare,
    this.currentPrice,
    this.currentValue,
    required this.totalCost,
    this.gainLoss,
    this.gainLossPercentage,
    this.lastUpdated,
  });

  factory StockHolding.fromJson(Map<String, dynamic> json) {
    return StockHolding(
      id: json['id'] as String,
      symbol: json['symbol'] as String,
      name: json['name'] as String?,
      quantity: (json['quantity'] as num).toDouble(),
      averageCostPerShare: Amount.fromJson(
        json['averageCostPerShare'] as Map<String, dynamic>,
      ),
      currentPrice: json['currentPrice'] != null
          ? Amount.fromJson(json['currentPrice'] as Map<String, dynamic>)
          : null,
      currentValue: json['currentValue'] != null
          ? Amount.fromJson(json['currentValue'] as Map<String, dynamic>)
          : null,
      totalCost: Amount.fromJson(json['totalCost'] as Map<String, dynamic>),
      gainLoss: json['gainLoss'] != null
          ? Amount.fromJson(json['gainLoss'] as Map<String, dynamic>)
          : null,
      gainLossPercentage: json['gainLossPercentage'] != null
          ? (json['gainLossPercentage'] as num).toDouble()
          : null,
      lastUpdated: json['lastUpdated'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'name': name,
      'quantity': quantity,
      'averageCostPerShare': averageCostPerShare.toJson(),
      'currentPrice': currentPrice?.toJson(),
      'currentValue': currentValue?.toJson(),
      'totalCost': totalCost.toJson(),
      'gainLoss': gainLoss?.toJson(),
      'gainLossPercentage': gainLossPercentage,
      'lastUpdated': lastUpdated,
    };
  }

  StockHolding copyWith({
    String? id,
    String? symbol,
    String? name,
    double? quantity,
    Amount? averageCostPerShare,
    Amount? currentPrice,
    Amount? currentValue,
    Amount? totalCost,
    Amount? gainLoss,
    double? gainLossPercentage,
    int? lastUpdated,
  }) {
    return StockHolding(
      id: id ?? this.id,
      symbol: symbol ?? this.symbol,
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      averageCostPerShare: averageCostPerShare ?? this.averageCostPerShare,
      currentPrice: currentPrice ?? this.currentPrice,
      currentValue: currentValue ?? this.currentValue,
      totalCost: totalCost ?? this.totalCost,
      gainLoss: gainLoss ?? this.gainLoss,
      gainLossPercentage: gainLossPercentage ?? this.gainLossPercentage,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

// Generic asset (non-stock)
class Asset {
  final String id;
  final AssetType type;
  final String name;
  final Amount value;
  final String? description;
  final int? lastUpdated;

  Asset({
    required this.id,
    required this.type,
    required this.name,
    required this.value,
    this.description,
    this.lastUpdated,
  });

  factory Asset.fromJson(Map<String, dynamic> json) {
    return Asset(
      id: json['id'] as String,
      type: AssetType.fromJson(json['type'] as String),
      name: json['name'] as String,
      value: Amount.fromJson(json['value'] as Map<String, dynamic>),
      description: json['description'] as String?,
      lastUpdated: json['lastUpdated'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toJson(),
      'name': name,
      'value': value.toJson(),
      'description': description,
      'lastUpdated': lastUpdated,
    };
  }

  Asset copyWith({
    String? id,
    AssetType? type,
    String? name,
    Amount? value,
    String? description,
    int? lastUpdated,
  }) {
    return Asset(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      value: value ?? this.value,
      description: description ?? this.description,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

// Liability types
enum LiabilityType {
  loan,
  creditCard,
  mortgage,
  other;

  String toJson() {
    switch (this) {
      case LiabilityType.loan:
        return 'loan';
      case LiabilityType.creditCard:
        return 'credit_card';
      case LiabilityType.mortgage:
        return 'mortgage';
      case LiabilityType.other:
        return 'other';
    }
  }

  static LiabilityType fromJson(String json) {
    switch (json) {
      case 'loan':
        return LiabilityType.loan;
      case 'credit_card':
        return LiabilityType.creditCard;
      case 'mortgage':
        return LiabilityType.mortgage;
      case 'other':
      default:
        return LiabilityType.other;
    }
  }
}

// Liability/debt
class Liability {
  final String id;
  final LiabilityType type;
  final String name;
  final Amount amount;
  final double? interestRate;
  final String? description;
  final int? lastUpdated;

  Liability({
    required this.id,
    required this.type,
    required this.name,
    required this.amount,
    this.interestRate,
    this.description,
    this.lastUpdated,
  });

  factory Liability.fromJson(Map<String, dynamic> json) {
    return Liability(
      id: json['id'] as String,
      type: LiabilityType.fromJson(json['type'] as String),
      name: json['name'] as String,
      amount: Amount.fromJson(json['amount'] as Map<String, dynamic>),
      interestRate: json['interestRate'] != null
          ? (json['interestRate'] as num).toDouble()
          : null,
      description: json['description'] as String?,
      lastUpdated: json['lastUpdated'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toJson(),
      'name': name,
      'amount': amount.toJson(),
      'interestRate': interestRate,
      'description': description,
      'lastUpdated': lastUpdated,
    };
  }

  Liability copyWith({
    String? id,
    LiabilityType? type,
    String? name,
    Amount? amount,
    double? interestRate,
    String? description,
    int? lastUpdated,
  }) {
    return Liability(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      amount: amount ?? this.amount,
      interestRate: interestRate ?? this.interestRate,
      description: description ?? this.description,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

// User's complete portfolio
class Portfolio {
  final String userId;
  final List<StockHolding> stockHoldings;
  final List<Asset> assets;
  final List<Liability> liabilities;
  final Amount totalAssets;
  final Amount totalLiabilities;
  final Amount netWorth;
  final int lastCalculated;

  Portfolio({
    required this.userId,
    required this.stockHoldings,
    required this.assets,
    required this.liabilities,
    required this.totalAssets,
    required this.totalLiabilities,
    required this.netWorth,
    required this.lastCalculated,
  });

  factory Portfolio.fromJson(Map<String, dynamic> json) {
    return Portfolio(
      userId: json['userId'] as String,
      stockHoldings: (json['stockHoldings'] as List<dynamic>)
          .map((e) => StockHolding.fromJson(e as Map<String, dynamic>))
          .toList(),
      assets: (json['assets'] as List<dynamic>)
          .map((e) => Asset.fromJson(e as Map<String, dynamic>))
          .toList(),
      liabilities: (json['liabilities'] as List<dynamic>)
          .map((e) => Liability.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalAssets: Amount.fromJson(json['totalAssets'] as Map<String, dynamic>),
      totalLiabilities: Amount.fromJson(
        json['totalLiabilities'] as Map<String, dynamic>,
      ),
      netWorth: Amount.fromJson(json['netWorth'] as Map<String, dynamic>),
      lastCalculated: json['lastCalculated'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'stockHoldings': stockHoldings.map((e) => e.toJson()).toList(),
      'assets': assets.map((e) => e.toJson()).toList(),
      'liabilities': liabilities.map((e) => e.toJson()).toList(),
      'totalAssets': totalAssets.toJson(),
      'totalLiabilities': totalLiabilities.toJson(),
      'netWorth': netWorth.toJson(),
      'lastCalculated': lastCalculated,
    };
  }
}

// Stock quote data from Yahoo Finance
class StockQuote {
  final String symbol;
  final String? name;
  final Amount price;
  final Amount? change;
  final double? changePercent;
  final String? marketState;
  final int timestamp;

  StockQuote({
    required this.symbol,
    this.name,
    required this.price,
    this.change,
    this.changePercent,
    this.marketState,
    required this.timestamp,
  });

  factory StockQuote.fromJson(Map<String, dynamic> json) {
    return StockQuote(
      symbol: json['symbol'] as String,
      name: json['name'] as String?,
      price: Amount.fromJson(json['price'] as Map<String, dynamic>),
      change: json['change'] != null
          ? Amount.fromJson(json['change'] as Map<String, dynamic>)
          : null,
      changePercent: json['changePercent'] != null
          ? (json['changePercent'] as num).toDouble()
          : null,
      marketState: json['marketState'] as String?,
      timestamp: json['timestamp'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'name': name,
      'price': price.toJson(),
      'change': change?.toJson(),
      'changePercent': changePercent,
      'marketState': marketState,
      'timestamp': timestamp,
    };
  }
}

// Net worth snapshot over time
class NetWorthSnapshot {
  final String userId;
  final int timestamp;
  final Amount netWorth;
  final Amount totalAssets;
  final Amount totalLiabilities;

  NetWorthSnapshot({
    required this.userId,
    required this.timestamp,
    required this.netWorth,
    required this.totalAssets,
    required this.totalLiabilities,
  });

  factory NetWorthSnapshot.fromJson(Map<String, dynamic> json) {
    return NetWorthSnapshot(
      userId: json['userId'] as String,
      timestamp: json['timestamp'] as int,
      netWorth: Amount.fromJson(json['netWorth'] as Map<String, dynamic>),
      totalAssets: Amount.fromJson(json['totalAssets'] as Map<String, dynamic>),
      totalLiabilities: Amount.fromJson(
        json['totalLiabilities'] as Map<String, dynamic>,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'timestamp': timestamp,
      'netWorth': netWorth.toJson(),
      'totalAssets': totalAssets.toJson(),
      'totalLiabilities': totalLiabilities.toJson(),
    };
  }
}
