import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_branch_sdk/flutter_branch_sdk.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../models/referral_config.dart';
import '../models/referral_data.dart';
import '../models/referral_reward.dart';

/// Main service for handling referrals and invites using Branch SDK
class WorkernReferralService {
  final ReferralConfig config;
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final FirebaseFunctions _functions;

  StreamController<ReferralData>? _referralDataController;
  Stream<ReferralData>? _referralDataStream;

  WorkernReferralService({
    required this.config,
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    FirebaseFunctions? functions,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _functions = functions ?? FirebaseFunctions.instance;

  /// Initialize Branch SDK and start listening for deep links
  Future<void> initialize() async {
    try {
      // Initialize Branch SDK
      await FlutterBranchSdk.init(
        enableLogging: config.enableLogging,
        disableTracking: false,
      );

      if (config.enableLogging) {
        // Validate SDK integration in debug mode
        FlutterBranchSdk.validateSDKIntegration();
      }

      // Set up deep link listener
      _setupDeepLinkListener();

      debugPrint('WorkernReferralService initialized successfully');
    } catch (e) {
      debugPrint('Error initializing WorkernReferralService: $e');
      rethrow;
    }
  }

  /// Set up listener for Branch deep link sessions
  void _setupDeepLinkListener() {
    _referralDataController = StreamController<ReferralData>.broadcast();
    _referralDataStream = _referralDataController!.stream;

    FlutterBranchSdk.listSession().listen(
      (data) {
        debugPrint('Branch session data received: $data');

        if (data.containsKey('+clicked_branch_link') &&
            data['+clicked_branch_link'] == true) {
          final referralData = ReferralData.fromBranchData(data);
          _referralDataController?.add(referralData);

          // Process referral if user is authenticated
          _processReferral(referralData);
        }
      },
      onError: (error) {
        debugPrint('Branch session error: $error');
      },
    );
  }

  /// Stream of referral data from deep links
  Stream<ReferralData>? get referralDataStream => _referralDataStream;

  /// Generate a referral link for the current user
  Future<String?> generateReferralLink({
    String? customAlias,
    String? campaign,
    String? channel,
    Map<String, dynamic>? customData,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw Exception('User must be authenticated to generate referral link');
      }

      // Get user's referral code
      final referralCode = await _getOrCreateReferralCode(user.uid);

      // Create Branch Universal Object
      final buo = BranchUniversalObject(
        canonicalIdentifier: 'referral/${user.uid}',
        title: 'Join ${config.appName}',
        imageUrl: config.logoUrl ?? '',
        contentDescription: 'Join me on ${config.appName} and get rewarded!',
        keywords: ['referral', 'invite', config.appName],
        publiclyIndex: true,
        locallyIndex: true,
        contentMetadata: BranchContentMetaData()
          ..addCustomMetadata('referrer_id', user.uid)
          ..addCustomMetadata('referrer_name', user.displayName ?? 'Friend')
          ..addCustomMetadata('referral_code', referralCode)
          ..addCustomMetadata('app_name', config.appName),
      );

      // Add custom metadata
      if (customData != null) {
        customData.forEach((key, value) {
          buo.contentMetadata.addCustomMetadata(key, value);
        });
      }

      // Create link properties
      final lp = BranchLinkProperties(
        alias: customAlias,
        channel: channel ?? 'referral',
        feature: 'invite',
        campaign: campaign ?? 'user_referral',
        stage: 'invite',
        tags: ['referral', config.appId],
      );

      // Add control parameters for deep linking
      lp.addControlParam('\$desktop_url', config.deepLinkDomain ?? '');
      lp.addControlParam('\$ios_url', config.deepLinkDomain ?? '');
      lp.addControlParam('\$android_url', config.deepLinkDomain ?? '');

      // Generate short URL
      final response = await FlutterBranchSdk.getShortUrl(
        buo: buo,
        linkProperties: lp,
      );

      if (response.success) {
        final link = response.result as String;

        // Track link generation
        await _trackReferralEvent('referral_link_generated', {
          'user_id': user.uid,
          'link': link,
          'campaign': campaign,
          'channel': channel,
        });

        return link;
      } else {
        debugPrint('Error generating link: ${response.errorMessage}');
        return null;
      }
    } catch (e) {
      debugPrint('Error in generateReferralLink: $e');
      return null;
    }
  }

  /// Share referral link using native share sheet
  Future<bool> shareReferralLink({
    String? customMessage,
    String? campaign,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw Exception('User must be authenticated to share referral link');
      }

      final referralCode = await _getOrCreateReferralCode(user.uid);

      final buo = BranchUniversalObject(
        canonicalIdentifier: 'referral/${user.uid}',
        title: 'Join ${config.appName}',
        imageUrl: config.logoUrl ?? '',
        contentDescription: customMessage ??
            'Join me on ${config.appName} using my referral code: $referralCode',
        keywords: ['referral', 'invite', config.appName],
        publiclyIndex: true,
        locallyIndex: true,
        contentMetadata: BranchContentMetaData()
          ..addCustomMetadata('referrer_id', user.uid)
          ..addCustomMetadata('referrer_name', user.displayName ?? 'Friend')
          ..addCustomMetadata('referral_code', referralCode)
          ..addCustomMetadata('app_name', config.appName),
      );

      final lp = BranchLinkProperties(
        channel: 'share',
        feature: 'invite',
        campaign: campaign ?? 'user_referral',
        stage: 'share',
        tags: ['referral', config.appId],
      );

      final response = await FlutterBranchSdk.showShareSheet(
        buo: buo,
        linkProperties: lp,
        messageText: customMessage ??
            '🎁 Join me on ${config.appName}! Use my referral code: $referralCode',
        androidMessageTitle: 'Invite Friends to ${config.appName}',
        androidSharingTitle: 'Share via',
      );

      if (response.success) {
        // Track share event
        await _trackReferralEvent('referral_shared', {
          'user_id': user.uid,
          'campaign': campaign,
        });
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error in shareReferralLink: $e');
      return false;
    }
  }

  /// Get or create a unique referral code for the user
  Future<String> _getOrCreateReferralCode(String userId) async {
    try {
      final docRef = _firestore.collection('referralCodes').doc(userId);
      final doc = await docRef.get();

      if (doc.exists) {
        return doc.data()?['code'] ?? _generateReferralCode(userId);
      }

      // Generate new code
      final code = _generateReferralCode(userId);
      await docRef.set({
        'code': code,
        'userId': userId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      return code;
    } catch (e) {
      debugPrint('Error in _getOrCreateReferralCode: $e');
      return _generateReferralCode(userId);
    }
  }

  /// Generate a unique referral code
  String _generateReferralCode(String userId) {
    // Use first 6 characters of user ID + random string
    final userPart = userId.substring(0, 6).toUpperCase();
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final randomPart = timestamp.substring(timestamp.length - 4);
    return '$userPart$randomPart';
  }

  /// Process referral when user signs up via referral link
  Future<void> _processReferral(ReferralData referralData) async {
    try {
      final user = _auth.currentUser;
      if (user == null || referralData.referrerId == null) return;

      // Don't process if user is referring themselves
      if (user.uid == referralData.referrerId) {
        debugPrint('User cannot refer themselves');
        return;
      }

      // Call Cloud Function to process referral
      final callable = _functions.httpsCallable('processReferral');
      await callable.call({
        'referrerId': referralData.referrerId,
        'refereeId': user.uid,
        'referralCode': referralData.referralCode,
        'campaign': referralData.campaign,
        'channel': referralData.channel,
        'customData': referralData.customData,
      });

      debugPrint('Referral processed successfully');
    } catch (e) {
      debugPrint('Error processing referral: $e');
    }
  }

  /// Get referral statistics for current user
  Future<ReferralStats?> getReferralStats() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('referrals')
          .doc('stats')
          .get();

      if (!doc.exists) {
        // Initialize stats if not exists
        final referralCode = await _getOrCreateReferralCode(user.uid);
        final stats = ReferralStats(
          userId: user.uid,
          referralCode: referralCode,
          createdAt: DateTime.now(),
        );

        await doc.reference.set(stats.toJson());
        return stats;
      }

      return ReferralStats.fromFirestore(doc);
    } catch (e) {
      debugPrint('Error getting referral stats: $e');
      return null;
    }
  }

  /// Stream of user's referral statistics
  Stream<ReferralStats?> watchReferralStats() {
    final user = _auth.currentUser;
    if (user == null) {
      return Stream.value(null);
    }

    return _firestore
        .collection('users')
        .doc(user.uid)
        .collection('referrals')
        .doc('stats')
        .snapshots()
        .map((doc) => doc.exists ? ReferralStats.fromFirestore(doc) : null);
  }

  /// Get pending rewards for current user
  Future<List<ReferralReward>> getPendingRewards() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return [];

      final snapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('rewards')
          .where('status', isEqualTo: RewardStatus.pending.name)
          .get();

      return snapshot.docs
          .map((doc) => ReferralReward.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error getting pending rewards: $e');
      return [];
    }
  }

  /// Claim a reward
  Future<bool> claimReward(String rewardId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final callable = _functions.httpsCallable('claimReferralReward');
      final result = await callable.call({
        'rewardId': rewardId,
        'userId': user.uid,
      });

      return result.data['success'] == true;
    } catch (e) {
      debugPrint('Error claiming reward: $e');
      return false;
    }
  }

  /// Track custom referral event
  Future<void> _trackReferralEvent(
    String eventName,
    Map<String, dynamic> properties,
  ) async {
    try {
      final event = BranchEvent.customEvent(eventName);
      properties.forEach((key, value) {
        event.addCustomData(key, value.toString());
      });
      await FlutterBranchSdk.trackContentWithoutBuo(branchEvent: event);
    } catch (e) {
      debugPrint('Error tracking event: $e');
    }
  }

  /// Set user identity in Branch
  Future<void> setUserIdentity(String userId) async {
    try {
      await FlutterBranchSdk.setIdentity(userId);
    } catch (e) {
      debugPrint('Error setting user identity: $e');
    }
  }

  /// Clear user identity (logout)
  Future<void> clearUserIdentity() async {
    try {
      await FlutterBranchSdk.logout();
    } catch (e) {
      debugPrint('Error clearing user identity: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    _referralDataController?.close();
  }
}
