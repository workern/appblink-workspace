import 'base.dart';
import 'gift_reason.dart';

/// Person information
class PersonInfo {
  final String name;
  final String? email;
  final String? whatsAppNumber;
  final String? phoneNumber;

  const PersonInfo({
    required this.name,
    this.email,
    this.whatsAppNumber,
    this.phoneNumber,
  });

  Map<String, dynamic> toJson() => {
    'name': name,
    if (email != null && email!.isNotEmpty) 'email': email,
    if (whatsAppNumber != null && whatsAppNumber!.isNotEmpty)
      'whatsAppNumber': whatsAppNumber,
    if (phoneNumber != null && phoneNumber!.isNotEmpty)
      'phoneNumber': phoneNumber,
  };

  factory PersonInfo.fromJson(Map<String, dynamic> json) {
    return PersonInfo(
      name: json['name'] as String,
      email: json['email'] as String?,
      whatsAppNumber: json['whatsAppNumber'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
    );
  }

  PersonInfo copyWith({
    String? name,
    String? email,
    String? whatsAppNumber,
    String? phoneNumber,
  }) {
    return PersonInfo(
      name: name ?? this.name,
      email: email ?? this.email,
      whatsAppNumber: whatsAppNumber ?? this.whatsAppNumber,
      phoneNumber: phoneNumber ?? this.phoneNumber,
    );
  }
}

/// Message displayed when recipient agrees (clicks Yes)
class OnAgreeMessage {
  final String? type; // 'text', 'image', 'gif', 'video'
  final String? mediaUrl;
  final String? text;
  final bool required;

  const OnAgreeMessage({
    this.type,
    this.mediaUrl,
    this.text,
    required this.required,
  });

  Map<String, dynamic> toJson() => {
    'type': type,
    'mediaUrl': mediaUrl,
    'text': text,
    'required': required,
  };

  factory OnAgreeMessage.fromJson(Map<String, dynamic> json) {
    return OnAgreeMessage(
      type: json['type'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      text: json['text'] as String?,
      required: json['required'] as bool? ?? false,
    );
  }

  OnAgreeMessage copyWith({
    String? type,
    String? mediaUrl,
    String? text,
    bool? required,
  }) {
    return OnAgreeMessage(
      type: type ?? this.type,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      text: text ?? this.text,
      required: required ?? this.required,
    );
  }
}

/// Custom domain configuration
class CustomDomain {
  final bool required;
  final String? name;

  const CustomDomain({required this.required, this.name});

  Map<String, dynamic> toJson() => {'required': required, 'name': name};

  factory CustomDomain.fromJson(Map<String, dynamic> json) {
    return CustomDomain(
      required: json['required'] as bool? ?? false,
      name: json['name'] as String?,
    );
  }

  CustomDomain copyWith({bool? required, String? name}) {
    return CustomDomain(
      required: required ?? this.required,
      name: name ?? this.name,
    );
  }
}

/// Gateway order creation result
class GatewayOrderCreationResult {
  final String? orderId;
  final String? checkoutUrl;
  final Map<String, dynamic>? metadata;

  const GatewayOrderCreationResult({
    this.orderId,
    this.checkoutUrl,
    this.metadata,
  });

  Map<String, dynamic> toJson() => {
    'orderId': orderId,
    'checkoutUrl': checkoutUrl,
    'metadata': metadata,
  };

  factory GatewayOrderCreationResult.fromJson(Map<String, dynamic> json) {
    return GatewayOrderCreationResult(
      orderId: json['orderId'] as String?,
      checkoutUrl: json['checkoutUrl'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}

/// Billing information
class Billing {
  final String status; // 'notPaid' | 'paid' | 'failed'
  final GatewayOrderCreationResult gateway;
  final Map<String, String?> transaction;

  const Billing({
    required this.status,
    required this.gateway,
    required this.transaction,
  });

  Map<String, dynamic> toJson() => {
    'status': status,
    'gateway': gateway.toJson(),
    'transaction': transaction,
  };

  factory Billing.fromJson(Map<String, dynamic> json) {
    return Billing(
      status: json['status'] as String? ?? 'notPaid',
      gateway: GatewayOrderCreationResult.fromJson(
        json['gateway'] as Map<String, dynamic>? ?? {},
      ),
      transaction: Map<String, String?>.from(
        json['transaction'] as Map<String, dynamic>? ?? {'id': null},
      ),
    );
  }

  Billing copyWith({
    String? status,
    GatewayOrderCreationResult? gateway,
    Map<String, String?>? transaction,
  }) {
    return Billing(
      status: status ?? this.status,
      gateway: gateway ?? this.gateway,
      transaction: transaction ?? this.transaction,
    );
  }
}

/// Analytics data for custom website
class CustomWebsiteAnalytics {
  final int viewsCount;
  final int yesClicked;

  const CustomWebsiteAnalytics({
    required this.viewsCount,
    required this.yesClicked,
  });

  Map<String, dynamic> toJson() => {
    'viewsCount': viewsCount,
    'yesClicked': yesClicked,
  };

  factory CustomWebsiteAnalytics.fromJson(Map<String, dynamic> json) {
    return CustomWebsiteAnalytics(
      viewsCount: json['viewsCount'] as int? ?? 0,
      yesClicked: json['yesClicked'] as int? ?? 0,
    );
  }

  CustomWebsiteAnalytics copyWith({int? viewsCount, int? yesClicked}) {
    return CustomWebsiteAnalytics(
      viewsCount: viewsCount ?? this.viewsCount,
      yesClicked: yesClicked ?? this.yesClicked,
    );
  }
}

/// Gift information
class Gift {
  final String? url;
  final GiftReason reason;

  const Gift({this.url, required this.reason});

  Map<String, dynamic> toJson() => {'url': url, 'reason': reason.toJson()};

  factory Gift.fromJson(Map<String, dynamic> json) {
    return Gift(
      url: json['url'] as String?,
      reason: GiftReason.fromJson(json['reason'] as String),
    );
  }

  Gift copyWith({String? url, GiftReason? reason}) {
    return Gift(url: url ?? this.url, reason: reason ?? this.reason);
  }
}

/// Custom website model (extends Base for Firestore compatibility)
class CustomWebsite extends Base {
  final PersonInfo recipient;
  final OnAgreeMessage onAgreeMessage;
  final PersonInfo sender;
  final CustomDomain customDomain;
  final Gift gift;
  final Billing billing;
  final CustomWebsiteAnalytics analytics;

  CustomWebsite({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.recipient,
    required this.onAgreeMessage,
    required this.sender,
    required this.customDomain,
    required this.gift,
    required this.billing,
    required this.analytics,
  });

  Map<String, dynamic> toJson() => {
    ...super.baseToJson(),
    'recipient': recipient.toJson(),
    'onAgreeMessage': onAgreeMessage.toJson(),
    'sender': sender.toJson(),
    'customDomain': customDomain.toJson(),
    'gift': gift.toJson(),
    'billing': billing.toJson(),
    'analytics': analytics.toJson(),
  };

  factory CustomWebsite.fromJson(Map<String, dynamic> json) {
    final baseFields = Base.parseBaseFields(json);
    return CustomWebsite(
      id: baseFields['id'] as String,
      createdAt: baseFields['createdAt'] as DateTime,
      updatedAt: baseFields['updatedAt'] as DateTime,
      owner: baseFields['owner'] as BaseOwner,
      space: baseFields['space'] as BaseSpace,
      recipient: PersonInfo.fromJson(json['recipient'] as Map<String, dynamic>),
      onAgreeMessage: OnAgreeMessage.fromJson(
        json['onAgreeMessage'] as Map<String, dynamic>,
      ),
      sender: PersonInfo.fromJson(json['sender'] as Map<String, dynamic>),
      customDomain: CustomDomain.fromJson(
        json['customDomain'] as Map<String, dynamic>,
      ),
      gift: Gift.fromJson(json['gift'] as Map<String, dynamic>),
      billing: Billing.fromJson(json['billing'] as Map<String, dynamic>),
      analytics: CustomWebsiteAnalytics.fromJson(
        json['analytics'] as Map<String, dynamic>,
      ),
    );
  }

  CustomWebsite copyWith({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    BaseOwner? owner,
    BaseSpace? space,
    PersonInfo? recipient,
    OnAgreeMessage? onAgreeMessage,
    PersonInfo? sender,
    CustomDomain? customDomain,
    Gift? gift,
    Billing? billing,
    CustomWebsiteAnalytics? analytics,
  }) {
    return CustomWebsite(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      owner: owner ?? this.owner,
      space: space ?? this.space,
      recipient: recipient ?? this.recipient,
      onAgreeMessage: onAgreeMessage ?? this.onAgreeMessage,
      sender: sender ?? this.sender,
      customDomain: customDomain ?? this.customDomain,
      gift: gift ?? this.gift,
      billing: billing ?? this.billing,
      analytics: analytics ?? this.analytics,
    );
  }
}
