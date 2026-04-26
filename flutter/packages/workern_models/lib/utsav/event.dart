import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_utils/workern_utils.dart';
import '../base.dart';
import '../amount.dart';

/// Event location details
class EventLocation {
  final String name;
  final String address;
  final String city;
  final EventCoordinates? coordinates;

  EventLocation({
    required this.name,
    required this.address,
    required this.city,
    this.coordinates,
  });

  factory EventLocation.fromJson(Map<String, dynamic> json) {
    return EventLocation(
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      coordinates: json['coordinates'] != null
          ? EventCoordinates.fromJson(json['coordinates'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'address': address,
      'city': city,
      if (coordinates != null) 'coordinates': coordinates!.toJson(),
    };
  }
}

/// Geographic coordinates
class EventCoordinates {
  final double latitude;
  final double longitude;

  EventCoordinates({required this.latitude, required this.longitude});

  factory EventCoordinates.fromJson(Map<String, dynamic> json) {
    return EventCoordinates(
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'latitude': latitude, 'longitude': longitude};
  }
}

/// Event category enum
enum EventCategory {
  MUSIC,
  DANCE,
  THEATER,
  COMEDY,
  SPORTS,
  FESTIVAL,
  CONFERENCE,
  WORKSHOP,
  OTHER,
}

/// Event status enum
enum EventStatus { UPCOMING, ONGOING, COMPLETED, CANCELLED }

/// Event organizer info
class EventOrganizer {
  final String uid;
  final String name;
  final String? contactEmail;
  final String? contactPhone;

  EventOrganizer({
    required this.uid,
    required this.name,
    this.contactEmail,
    this.contactPhone,
  });

  factory EventOrganizer.fromJson(Map<String, dynamic> json) {
    return EventOrganizer(
      uid: json['uid'] ?? '',
      name: json['name'] ?? '',
      contactEmail: json['contactEmail'],
      contactPhone: json['contactPhone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'name': name,
      if (contactEmail != null) 'contactEmail': contactEmail,
      if (contactPhone != null) 'contactPhone': contactPhone,
    };
  }
}

/// Event model matching TypeScript Event interface
class Event extends Base {
  final String title;
  final String description;
  final EventCategory category;
  final EventStatus status;
  final List<String> images;
  final EventLocation location;
  final DateTime startTime;
  final DateTime endTime;
  final Amount ticketPrice;
  final int totalTickets;
  final int availableTickets;
  final EventOrganizer organizer;
  final List<String>? tags;

  Event({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.title,
    required this.description,
    required this.category,
    required this.status,
    required this.images,
    required this.location,
    required this.startTime,
    required this.endTime,
    required this.ticketPrice,
    required this.totalTickets,
    required this.availableTickets,
    required this.organizer,
    this.tags,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    final baseFields = Base.parseBaseFields(json);
    return Event(
      id: baseFields['id'],
      createdAt: baseFields['createdAt'],
      updatedAt: baseFields['updatedAt'],
      owner: baseFields['owner'],
      space: baseFields['space'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: EventCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => EventCategory.OTHER,
      ),
      status: EventStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => EventStatus.UPCOMING,
      ),
      images: List<String>.from(json['images'] ?? []),
      location: EventLocation.fromJson(json['location'] ?? {}),
      startTime: parseTimestamp(json['startTime']) ?? DateTime.now(),
      endTime: parseTimestamp(json['endTime']) ?? DateTime.now(),
      ticketPrice: Amount.fromJson(json['ticketPrice'] ?? {}),
      totalTickets: json['totalTickets'] ?? 0,
      availableTickets: json['availableTickets'] ?? 0,
      organizer: EventOrganizer.fromJson(json['organizer'] ?? {}),
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'owner': owner.toJson(),
      'space': space.toJson(),
      'title': title,
      'description': description,
      'category': category.name,
      'status': status.name,
      'images': images,
      'location': location.toJson(),
      'startTime': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'ticketPrice': ticketPrice.toJson(),
      'totalTickets': totalTickets,
      'availableTickets': availableTickets,
      'organizer': organizer.toJson(),
      if (tags != null) 'tags': tags,
    };
  }
}
