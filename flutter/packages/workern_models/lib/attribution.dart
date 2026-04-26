import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/base.dart';
import 'package:workern_utils/workern_utils.dart';

enum DeviceType { DESKTOP, MOBILE, TABLET, BOT, UNKNOWN }

class AttributionClick {
  final DateTime timestamp;
  final String ipAddress;
  final String ipHash;
  final String userAgent;
  final DeviceType deviceType;
  final bool isBot;
  final String? referrer;
  final String? country;
  final String? city;
  final String? fingerprint;

  AttributionClick({
    required this.timestamp,
    required this.ipAddress,
    required this.ipHash,
    required this.userAgent,
    required this.deviceType,
    required this.isBot,
    this.referrer,
    this.country,
    this.city,
    this.fingerprint,
  });

  factory AttributionClick.fromJson(Map<String, dynamic> json) {
    return AttributionClick(
      timestamp: parseTimestamp(json['timestamp']) ?? DateTime.now(),
      ipAddress: json['ipAddress'] ?? '',
      ipHash: json['ipHash'] ?? '',
      userAgent: json['userAgent'] ?? '',
      deviceType: DeviceType.values.firstWhere(
        (e) => e.name == json['deviceType'],
        orElse: () => DeviceType.UNKNOWN,
      ),
      isBot: json['isBot'] ?? false,
      referrer: json['referrer'],
      country: json['country'],
      city: json['city'],
      fingerprint: json['fingerprint'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'timestamp': timestamp,
      'ipAddress': ipAddress,
      'ipHash': ipHash,
      'userAgent': userAgent,
      'deviceType': deviceType.name,
      'isBot': isBot,
      'referrer': referrer,
      'country': country,
      'city': city,
      'fingerprint': fingerprint,
    };
  }
}

class AttributionLink extends Base {
  // Link Details
  final String shortCode;
  final String originalUrl;
  final String fullShortUrl;

  // Context
  final String? campaignId;
  final String? submissionId;
  final String? creatorId;

  // Tracking
  final int totalClicks;
  final int uniqueClicks;
  final int botClicks;

  // Analytics
  final DateTime? lastClickedAt;
  final Map<String, int> clicksByCountry;
  final Map<String, int> clicksByDevice;

  // Status
  final bool isActive;
  final DateTime? expiresAt;

  AttributionLink({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.shortCode,
    required this.originalUrl,
    required this.fullShortUrl,
    this.campaignId,
    this.submissionId,
    this.creatorId,
    required this.totalClicks,
    required this.uniqueClicks,
    required this.botClicks,
    this.lastClickedAt,
    required this.clicksByCountry,
    required this.clicksByDevice,
    required this.isActive,
    this.expiresAt,
  });

  factory AttributionLink.fromJson(Map<String, dynamic> json) {
    return AttributionLink(
      id: json['id'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
      owner: BaseOwner.fromJson(json['owner'] ?? {}),
      space: BaseSpace.fromJson(json['space'] ?? {}),
      shortCode: json['shortCode'] ?? '',
      originalUrl: json['originalUrl'] ?? '',
      fullShortUrl: json['fullShortUrl'] ?? '',
      campaignId: json['campaignId'],
      submissionId: json['submissionId'],
      creatorId: json['creatorId'],
      totalClicks: json['totalClicks'] ?? 0,
      uniqueClicks: json['uniqueClicks'] ?? 0,
      botClicks: json['botClicks'] ?? 0,
      lastClickedAt: json['lastClickedAt'] != null
          ? parseTimestamp(json['lastClickedAt'])
          : null,
      clicksByCountry: Map<String, int>.from(json['clicksByCountry'] ?? {}),
      clicksByDevice: Map<String, int>.from(json['clicksByDevice'] ?? {}),
      isActive: json['isActive'] ?? true,
      expiresAt: json['expiresAt'] != null
          ? parseTimestamp(json['expiresAt'])
          : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'owner': owner.toJson(),
      'space': space.toJson(),
      'shortCode': shortCode,
      'originalUrl': originalUrl,
      'fullShortUrl': fullShortUrl,
      'campaignId': campaignId,
      'submissionId': submissionId,
      'creatorId': creatorId,
      'totalClicks': totalClicks,
      'uniqueClicks': uniqueClicks,
      'botClicks': botClicks,
      'lastClickedAt': lastClickedAt,
      'clicksByCountry': clicksByCountry,
      'clicksByDevice': clicksByDevice,
      'isActive': isActive,
      'expiresAt': expiresAt,
    };
  }
}

class AttributionAnalytics {
  final String linkId;
  final int totalClicks;
  final int uniqueClicks;
  final int botClicks;
  final double conversionRate;
  final List<CountryClicks> topCountries;
  final List<DeviceClicks> topDevices;
  final List<ClicksOverTime> clicksOverTime;

  AttributionAnalytics({
    required this.linkId,
    required this.totalClicks,
    required this.uniqueClicks,
    required this.botClicks,
    required this.conversionRate,
    required this.topCountries,
    required this.topDevices,
    required this.clicksOverTime,
  });

  factory AttributionAnalytics.fromJson(Map<String, dynamic> json) {
    return AttributionAnalytics(
      linkId: json['linkId'] ?? '',
      totalClicks: json['totalClicks'] ?? 0,
      uniqueClicks: json['uniqueClicks'] ?? 0,
      botClicks: json['botClicks'] ?? 0,
      conversionRate: (json['conversionRate'] as num?)?.toDouble() ?? 0,
      topCountries:
          (json['topCountries'] as List?)
              ?.map((e) => CountryClicks.fromJson(e))
              .toList() ??
          [],
      topDevices:
          (json['topDevices'] as List?)
              ?.map((e) => DeviceClicks.fromJson(e))
              .toList() ??
          [],
      clicksOverTime:
          (json['clicksOverTime'] as List?)
              ?.map((e) => ClicksOverTime.fromJson(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'linkId': linkId,
      'totalClicks': totalClicks,
      'uniqueClicks': uniqueClicks,
      'botClicks': botClicks,
      'conversionRate': conversionRate,
      'topCountries': topCountries.map((e) => e.toJson()).toList(),
      'topDevices': topDevices.map((e) => e.toJson()).toList(),
      'clicksOverTime': clicksOverTime.map((e) => e.toJson()).toList(),
    };
  }
}

class CountryClicks {
  final String country;
  final int clicks;

  CountryClicks({required this.country, required this.clicks});

  factory CountryClicks.fromJson(Map<String, dynamic> json) {
    return CountryClicks(
      country: json['country'] ?? '',
      clicks: json['clicks'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'country': country, 'clicks': clicks};
  }
}

class DeviceClicks {
  final String device;
  final int clicks;

  DeviceClicks({required this.device, required this.clicks});

  factory DeviceClicks.fromJson(Map<String, dynamic> json) {
    return DeviceClicks(
      device: json['device'] ?? '',
      clicks: json['clicks'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'device': device, 'clicks': clicks};
  }
}

class ClicksOverTime {
  final String date;
  final int clicks;

  ClicksOverTime({required this.date, required this.clicks});

  factory ClicksOverTime.fromJson(Map<String, dynamic> json) {
    return ClicksOverTime(
      date: json['date'] ?? '',
      clicks: json['clicks'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'date': date, 'clicks': clicks};
  }
}
