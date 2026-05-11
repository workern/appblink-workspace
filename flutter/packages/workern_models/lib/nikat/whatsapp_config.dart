import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../base.dart';

/// Stored at: users/{shopOwnerId}/mySpaces/nikat/whatsappConfig
///
/// Holds the WhatsApp Business Account connection info for a Nikat shop owner.
/// Populated after the shop owner completes the Embedded Signup flow.
enum WhatsAppConnectionStatus { CONNECTED, DISCONNECTED, PENDING, ERROR }

WhatsAppConnectionStatus whatsAppConnectionStatusFromString(String value) {
  return WhatsAppConnectionStatus.values.firstWhere(
    (e) => e.name == value,
    orElse: () => WhatsAppConnectionStatus.DISCONNECTED,
  );
}

class WhatsAppConfig extends Base {
  /// WhatsApp Business Account ID (WABA ID) assigned by Meta
  final String wabaId;

  /// Phone Number ID for the business phone registered on this WABA
  final String phoneNumberId;

  /// Human-readable display phone number (e.g. "+91 98765 43210")
  final String displayPhoneNumber;

  /// Verified name of the WhatsApp Business profile
  final String verifiedName;

  /// Whether webhook is subscribed for this WABA
  final bool webhookSubscribed;

  /// Connection status
  final WhatsAppConnectionStatus status;

  WhatsAppConfig({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.wabaId,
    required this.phoneNumberId,
    required this.displayPhoneNumber,
    required this.verifiedName,
    required this.webhookSubscribed,
    required this.status,
  });

  factory WhatsAppConfig.fromJson(Map<String, dynamic> json) {
    final base = Base.parseBaseFields(json);
    return WhatsAppConfig(
      id: base['id'] as String,
      createdAt: base['createdAt'] as DateTime,
      updatedAt: base['updatedAt'] as DateTime,
      owner: base['owner'] as BaseOwner,
      space: base['space'] as BaseSpace,
      wabaId: json['wabaId'] as String? ?? '',
      phoneNumberId: json['phoneNumberId'] as String? ?? '',
      displayPhoneNumber: json['displayPhoneNumber'] as String? ?? '',
      verifiedName: json['verifiedName'] as String? ?? '',
      webhookSubscribed: json['webhookSubscribed'] as bool? ?? false,
      status: whatsAppConnectionStatusFromString(
        json['status'] as String? ?? 'DISCONNECTED',
      ),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
    'owner': owner.toJson(),
    'space': space.toJson(),
    'wabaId': wabaId,
    'phoneNumberId': phoneNumberId,
    'displayPhoneNumber': displayPhoneNumber,
    'verifiedName': verifiedName,
    'webhookSubscribed': webhookSubscribed,
    'status': status.name,
  };
}
