import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/base.dart';
import 'package:workern_models/campaign.dart';
import 'package:workern_utils/workern_utils.dart';

class SocialHandle {
  final SocialPlatform platform;
  final String handle;
  final String url;
  final int followersCount;
  final bool verified; // Platform verified (e.g., blue checkmark)
  final bool isConnected; // OAuth connected

  SocialHandle({
    required this.platform,
    required this.handle,
    required this.url,
    required this.followersCount,
    required this.verified,
    required this.isConnected,
  });

  factory SocialHandle.fromJson(Map<String, dynamic> json) {
    return SocialHandle(
      platform: SocialPlatform.values.firstWhere(
        (e) => e.name == json['platform'],
        orElse: () => SocialPlatform.INSTAGRAM,
      ),
      handle: json['handle'] ?? '',
      url: json['url'] ?? '',
      followersCount: json['followersCount'] ?? 0,
      verified: json['verified'] ?? false,
      isConnected: json['isConnected'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'platform': platform.name,
      'handle': handle,
      'url': url,
      'followersCount': followersCount,
      'verified': verified,
      'isConnected': isConnected,
    };
  }
}

class CreatorProfile extends Base {
  // Basic Info
  final String displayName;
  final String bio;
  final String? profilePicture;

  // Social Handles
  final List<SocialHandle> socialHandles;

  // Content Details
  final List<ContentGenre> genres;
  final List<String> contentLanguages;

  // Geographic
  final String country;
  final String? city;

  // Verification
  final bool isVerified;
  final DateTime? verificationDate;

  // Stats
  final double totalEarnings;
  final int completedCampaigns;
  final double? averageRating;

  // Status
  final bool isActive;
  final bool availableForWork;

  CreatorProfile({
    required super.id,
    required super.createdAt,
    required super.updatedAt,
    required super.owner,
    required super.space,
    required this.displayName,
    required this.bio,
    this.profilePicture,
    required this.socialHandles,
    required this.genres,
    required this.contentLanguages,
    required this.country,
    this.city,
    required this.isVerified,
    this.verificationDate,
    required this.totalEarnings,
    required this.completedCampaigns,
    this.averageRating,
    required this.isActive,
    required this.availableForWork,
  });

  factory CreatorProfile.fromJson(Map<String, dynamic> json) {
    return CreatorProfile(
      id: json['id'] ?? '',
      createdAt: parseTimestamp(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseTimestamp(json['updatedAt']) ?? DateTime.now(),
      owner: BaseOwner.fromJson(json['owner'] ?? {}),
      space: BaseSpace.fromJson(json['space'] ?? {}),
      displayName: json['displayName'] ?? '',
      bio: json['bio'] ?? '',
      profilePicture: json['profilePicture'],
      socialHandles:
          (json['socialHandles'] as List?)
              ?.map((e) => SocialHandle.fromJson(e))
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
      contentLanguages:
          (json['contentLanguages'] as List?)?.cast<String>() ?? [],
      country: json['country'] ?? '',
      city: json['city'],
      isVerified: json['isVerified'] ?? false,
      verificationDate: json['verificationDate'] != null
          ? parseTimestamp(json['verificationDate'])
          : null,
      totalEarnings: (json['totalEarnings'] as num?)?.toDouble() ?? 0,
      completedCampaigns: json['completedCampaigns'] ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble(),
      isActive: json['isActive'] ?? true,
      availableForWork: json['availableForWork'] ?? true,
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
      'displayName': displayName,
      'bio': bio,
      'profilePicture': profilePicture,
      'socialHandles': socialHandles.map((e) => e.toJson()).toList(),
      'genres': genres.map((e) => e.name).toList(),
      'contentLanguages': contentLanguages,
      'country': country,
      'city': city,
      'isVerified': isVerified,
      'verificationDate': verificationDate,
      'totalEarnings': totalEarnings,
      'completedCampaigns': completedCampaigns,
      'averageRating': averageRating,
      'isActive': isActive,
      'availableForWork': availableForWork,
    };
  }
}
