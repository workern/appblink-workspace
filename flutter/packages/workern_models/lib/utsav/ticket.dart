import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../base.dart';
import '../amount.dart';
import 'event.dart';

/// Ticket status enum
enum TicketStatus { ACTIVE, USED, CANCELLED, EXPIRED }

/// Simplified event info for ticket
class TicketEvent {
  final String id;
  final String title;
  final EventLocation location;
  final DateTime startTime;
  final DateTime endTime;
  final List<String> images;

  TicketEvent({
    required this.id,
    required this.title,
    required this.location,
    required this.startTime,
    required this.endTime,
    required this.images,
  });

  factory TicketEvent.fromJson(Map<String, dynamic> json) {
    return TicketEvent(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      location: EventLocation.fromJson(json['location'] ?? {}),
      startTime: parseTimestamp(json['startTime']) ?? DateTime.now(),
      endTime: parseTimestamp(json['endTime']) ?? DateTime.now(),
      images: List<String>.from(json['images'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'location': location.toJson(),
      'startTime': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'images': images,
    };
  }
}

/// Ticket model matching TypeScript Ticket interface
class Ticket extends Base {
  final TicketEvent event;
  final TicketStatus status;
  final DateTime purchasedAt;
  final Amount price;
  final String qrCode;
  final String ticketNumber;
  final String attendeeName;
  final String attendeeEmail;
  final String attendeePhone;
  final DateTime? usedAt;

  Ticket({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.event,
    required this.status,
    required this.purchasedAt,
    required this.price,
    required this.qrCode,
    required this.ticketNumber,
    required this.attendeeName,
    required this.attendeeEmail,
    required this.attendeePhone,
    this.usedAt,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    final baseFields = Base.parseBaseFields(json);
    return Ticket(
      id: baseFields['id'],
      createdAt: baseFields['createdAt'],
      updatedAt: baseFields['updatedAt'],
      owner: baseFields['owner'],
      space: baseFields['space'],
      event: TicketEvent.fromJson(json['event'] ?? {}),
      status: TicketStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TicketStatus.ACTIVE,
      ),
      purchasedAt: parseTimestamp(json['purchasedAt']) ?? DateTime.now(),
      price: Amount.fromJson(json['price'] ?? {}),
      qrCode: json['qrCode'] ?? '',
      ticketNumber: json['ticketNumber'] ?? '',
      attendeeName: json['attendeeName'] ?? '',
      attendeeEmail: json['attendeeEmail'] ?? '',
      attendeePhone: json['attendeePhone'] ?? '',
      usedAt: json['usedAt'] != null ? parseTimestamp(json['usedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'event': event.toJson(),
      'status': status.name,
      'purchasedAt': Timestamp.fromDate(purchasedAt),
      'price': price.toJson(),
      'qrCode': qrCode,
      'ticketNumber': ticketNumber,
      'attendeeName': attendeeName,
      'attendeeEmail': attendeeEmail,
      'attendeePhone': attendeePhone,
      if (usedAt != null) 'usedAt': Timestamp.fromDate(usedAt!),
    };
  }
}
