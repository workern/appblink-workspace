import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/base.dart';
import 'package:workern_models/amount.dart';
import 'package:workern_utils/workern_utils.dart';

enum CampaignType { PROMOTION, SPONSORSHIP, AFFILIATE }

enum CampaignStatus { DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED }

enum SocialPlatform {
  INSTAGRAM,
  YOUTUBE,
  TIKTOK,
  TWITTER,
  FACEBOOK,
  LINKEDIN,
  TWITCH,
}

enum ContentGenre {
  BEAUTY,
  FASHION,
  TECH,
  SPORTS,
  GAMING,
  FOOD,
  TRAVEL,
  LIFESTYLE,
  EDUCATION,
  ENTERTAINMENT,
  FITNESS,
  BUSINESS,
  OTHER,
}

class PlatformRequirement {
  final SocialPlatform platform;
  final int minFollowers;

  PlatformRequirement({required this.platform, required this.minFollowers});

  factory PlatformRequirement.fromJson(Map<String, dynamic> json) {
    return PlatformRequirement(
      platform: SocialPlatform.values.firstWhere(
        (e) => e.name == json['platform'],
        orElse: () => SocialPlatform.INSTAGRAM,
      ),
      minFollowers: json['minFollowers'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'platform': platform.name, 'minFollowers': minFollowers};
  }
}

class MediaFile {
  final String url;
  final String name;
  final int size; // in bytes
  final String type; // MIME type

  MediaFile({
    required this.url,
    required this.name,
    required this.size,
    required this.type,
  });

  factory MediaFile.fromJson(Map<String, dynamic> json) {
    return MediaFile(
      url: json['url'] ?? '',
      name: json['name'] ?? '',
      size: json['size'] ?? 0,
      type: json['type'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {'url': url, 'name': name, 'size': size, 'type': type};
  }
}

class Campaign extends Base {
  // Basic Info
  final String title;
  final CampaignType type;
  final CampaignStatus status;

  // Campaign Details
  final String targetUrl;
  final String description;
  final List<MediaFile> mediaFiles;

  // Creator Requirements
  final List<PlatformRequirement> platformRequirements;
  final List<ContentGenre> genres;
  final int numberOfCreatorsNeeded;
  final bool autoAccept;
  final bool onlyVerifiedCreators;

  // Geographic & Language
  final List<String> targetCountries;
  final String contentLanguage;

  // Budget
  final Amount budgetPerCreator;
  final Amount totalBudget;

  // Tracking
  final int applicationsCount;
  final int acceptedCount;
  final int completedCount;

  // Dates
  final DateTime startDate;
  final DateTime endDate;

  // Attribution Link
  final String? attributionLinkId;

  Campaign({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.title,
    required this.type,
    required this.status,
    required this.targetUrl,
    required this.description,
    required this.mediaFiles,
    required this.platformRequirements,
    required this.genres,
    required this.numberOfCreatorsNeeded,
    required this.autoAccept,
    required this.onlyVerifiedCreators,
    required this.targetCountries,
    required this.contentLanguage,
    required this.budgetPerCreator,
    required this.totalBudget,
    required this.applicationsCount,
    required this.acceptedCount,
    required this.completedCount,
    required this.startDate,
    required this.endDate,
    this.attributionLinkId,
  });

  factory Campaign.fromJson(Map<String, dynamic> json) {
    return Campaign(
      id: json['id'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
      owner: BaseOwner.fromJson(json['owner'] ?? {}),
      space: BaseSpace.fromJson(json['space'] ?? {}),
      title: json['title'] ?? '',
      type: CampaignType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => CampaignType.PROMOTION,
      ),
      status: CampaignStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => CampaignStatus.DRAFT,
      ),
      targetUrl: json['targetUrl'] ?? '',
      description: json['description'] ?? '',
      mediaFiles:
          (json['mediaFiles'] as List?)
              ?.map((e) => MediaFile.fromJson(e))
              .toList() ??
          [],
      platformRequirements:
          (json['platformRequirements'] as List?)
              ?.map((e) => PlatformRequirement.fromJson(e))
              .toList() ??
          [],
      genres:
          (json['genres'] as List?)
              ?.map(
                (e) => ContentGenre.values.firstWhere(
                  (g) => g.name == e,
                  orElse: () => ContentGenre.OTHER,
                ),
              )
              .toList() ??
          [],
      numberOfCreatorsNeeded: json['numberOfCreatorsNeeded'] ?? 1,
      autoAccept: json['autoAccept'] ?? false,
      onlyVerifiedCreators: json['onlyVerifiedCreators'] ?? false,
      targetCountries: (json['targetCountries'] as List?)?.cast<String>() ?? [],
      contentLanguage: json['contentLanguage'] ?? 'en',
      budgetPerCreator: Amount.fromJson(json['budgetPerCreator'] ?? {}),
      totalBudget: Amount.fromJson(json['totalBudget'] ?? {}),
      applicationsCount: json['applicationsCount'] ?? 0,
      acceptedCount: json['acceptedCount'] ?? 0,
      completedCount: json['completedCount'] ?? 0,
      startDate: parseTimestamp(json['startDate']) ?? DateTime.now(),
      endDate: parseTimestamp(json['endDate']) ?? DateTime.now(),
      attributionLinkId: json['attributionLinkId'],
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
      'title': title,
      'type': type.name,
      'status': status.name,
      'targetUrl': targetUrl,
      'description': description,
      'mediaFiles': mediaFiles.map((e) => e.toJson()).toList(),
      'platformRequirements': platformRequirements
          .map((e) => e.toJson())
          .toList(),
      'genres': genres.map((e) => e.name).toList(),
      'numberOfCreatorsNeeded': numberOfCreatorsNeeded,
      'autoAccept': autoAccept,
      'onlyVerifiedCreators': onlyVerifiedCreators,
      'targetCountries': targetCountries,
      'contentLanguage': contentLanguage,
      'budgetPerCreator': budgetPerCreator.toJson(),
      'totalBudget': totalBudget.toJson(),
      'applicationsCount': applicationsCount,
      'acceptedCount': acceptedCount,
      'completedCount': completedCount,
      'startDate': startDate,
      'endDate': endDate,
      'attributionLinkId': attributionLinkId,
    };
  }
}
