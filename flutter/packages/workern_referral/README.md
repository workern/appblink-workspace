# Workern Referral Package

A comprehensive referral and invite system for Workern apps using Branch SDK.

## Features

- 🔗 **Deep Link Generation**: Create shareable referral links with Branch SDK
- 📱 **Native Sharing**: Share referral links via native share sheets
- 🎁 **Reward System**: Track and manage referral rewards
- 📊 **Analytics**: Monitor referral performance and statistics
- 🔄 **Real-time Tracking**: Stream-based referral data updates
- 🎯 **Custom Campaigns**: Support for multiple referral campaigns
- 💾 **Firestore Integration**: Automatic data persistence

## Installation

Add to your app's `pubspec.yaml`:

```yaml
dependencies:
  workern_referral:
    path: ../../packages/workern_referral
```

## Platform Setup

### Android

1. Add Branch key to `AndroidManifest.xml` or use `assets/branch-config.json`
2. Configure deep link handling
3. Add ProGuard rules if using code obfuscation

### iOS

1. Add Branch key to `Info.plist` or use `assets/branch-config.json`
2. Configure Associated Domains
3. Handle deep links in AppDelegate

### Web

Add Branch JavaScript snippet to `web/index.html`:

```html
<script>
  (function (b, r, a, n, c, h, _, s, d, k) {
    if (!b[n] || !b[n]._q) {
      for (; s < _.length; ) c(h, _[s++]);
      d = r.createElement(a);
      d.async = 1;
      d.src = 'https://cdn.branch.io/branch-latest.min.js';
      k = r.getElementsByTagName(a)[0];
      k.parentNode.insertBefore(d, k);
      b[n] = h;
    }
  })(
    window,
    document,
    'script',
    'branch',
    function (b, r) {
      b[r] = function () {
        b._q.push([r, arguments]);
      };
    },
    { _q: [], _v: 1 },
    'addListener banner closeBanner closeJourney data deepview deepviewCta first init link logout removeListener setBranchViewData setIdentity track trackCommerceEvent logEvent disableTracking getBrowserFingerprintId crossPlatformIds lastAttributedTouchData setAPIResponseCallback qrCode setRequestMetaData setAPIUrl getAPIUrl setDMAParamsForEEA'.split(
      ' '
    ),
    0
  );
  var options = { no_journeys: true, tracking_disabled: false };
  branch.init('YOUR_BRANCH_KEY', options);
</script>
```

## Usage

### 1. Initialize the Service

```dart
import 'package:workern_referral/workern_referral.dart';

final config = ReferralConfig(
  branchKey: 'key_live_xxxx',
  appName: 'My App',
  appId: 'com.myapp',
  logoUrl: 'https://myapp.com/logo.png',
  deepLinkDomain: 'https://myapp.page.link',
  rewardConfig: ReferralRewardConfig(
    referrerSignupReward: 100,
    refereeSignupReward: 50,
    rewardCurrency: 'credits',
  ),
);

final referralService = WorkernReferralService(config: config);
await referralService.initialize();
```

### 2. Generate Referral Links

```dart
// Generate a simple referral link
final link = await referralService.generateReferralLink();
print('Referral link: $link');

// Generate with custom campaign
final campaignLink = await referralService.generateReferralLink(
  campaign: 'summer_promo',
  channel: 'email',
  customData: {'bonus': '200'},
);
```

### 3. Share Referral Links

```dart
// Show native share sheet
final shared = await referralService.shareReferralLink(
  customMessage: 'Join me on MyApp and earn rewards!',
  campaign: 'user_invite',
);
```

### 4. Listen for Deep Links

```dart
referralService.referralDataStream?.listen((referralData) {
  if (referralData.clickedBranchLink) {
    print('User came from referral: ${referralData.referrerId}');
    print('Referral code: ${referralData.referralCode}');
  }
});
```

### 5. Use with Riverpod

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workern_referral/workern_referral.dart';

class ReferralScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ReferralConfig(/* ... */);

    return Scaffold(
      appBar: AppBar(title: Text('Referrals')),
      body: Column(
        children: [
          // Display referral stats
          ReferralStatsCard(config: config),

          // Share button
          ReferralButton(
            config: config,
            customMessage: 'Join me on MyApp!',
            onShareSuccess: () => print('Shared!'),
          ),

          // Copy link button
          CopyReferralLinkButton(config: config),
        ],
      ),
    );
  }
}
```

### 6. Track User Identification

```dart
// On user login
await referralService.setUserIdentity(user.uid);

// On user logout
await referralService.clearUserIdentity();
```

### 7. Get Referral Statistics

```dart
// Get current stats
final stats = await referralService.getReferralStats();
print('Total referrals: ${stats?.totalReferrals}');
print('Rewards earned: ${stats?.totalRewardsEarned}');

// Watch stats with stream
referralService.watchReferralStats().listen((stats) {
  print('Updated referrals: ${stats?.totalReferrals}');
});
```

### 8. Manage Rewards

```dart
// Get pending rewards
final rewards = await referralService.getPendingRewards();

// Claim a reward
final claimed = await referralService.claimReward(rewardId);
```

## Backend Integration

Create a Cloud Function to process referrals:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const processReferral = functions.https.onCall(async (data, context) => {
  const { referrerId, refereeId, referralCode } = data;

  // Validate
  if (!referrerId || !refereeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing IDs');
  }

  const db = admin.firestore();
  const batch = db.batch();

  // Update referrer stats
  const referrerStatsRef = db
    .collection('users')
    .doc(referrerId)
    .collection('referrals')
    .doc('stats');

  batch.set(
    referrerStatsRef,
    {
      totalReferrals: admin.firestore.FieldValue.increment(1),
      pendingReferrals: admin.firestore.FieldValue.increment(1),
      referredUserIds: admin.firestore.FieldValue.arrayUnion(refereeId),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  // Create reward for referrer
  const rewardRef = db
    .collection('users')
    .doc(referrerId)
    .collection('rewards')
    .doc();

  batch.set(rewardRef, {
    userId: referrerId,
    type: 'referralSignup',
    amount: 100,
    currency: 'credits',
    status: 'pending',
    referredUserId: refereeId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { success: true };
});
```

## Widgets

### ReferralButton

Pre-built button for sharing referral links:

```dart
ReferralButton(
  config: config,
  customMessage: 'Join me!',
  campaign: 'summer_2024',
  onShareSuccess: () => print('Shared!'),
)
```

### ReferralStatsCard

Card displaying user's referral statistics:

```dart
ReferralStatsCard(
  config: config,
  padding: EdgeInsets.all(16),
)
```

### CopyReferralLinkButton

Button to copy referral link to clipboard:

```dart
CopyReferralLinkButton(
  config: config,
  campaign: 'email_campaign',
)
```

## Configuration Options

```dart
ReferralConfig(
  branchKey: 'key_live_xxxx',        // Branch API key
  appName: 'My App',                  // App name for messages
  appId: 'com.myapp',                 // App identifier
  logoUrl: 'https://...',             // Logo for link previews
  deepLinkDomain: 'https://...',      // Custom domain
  enableLogging: true,                // Debug logging
  useTestInstance: false,             // Use test Branch instance

  rewardConfig: ReferralRewardConfig(
    referrerSignupReward: 100,       // Reward for referrer
    refereeSignupReward: 50,         // Reward for referee
    referrerPurchaseReward: 200,     // Bonus on purchase
    rewardCurrency: 'credits',       // Currency name
    bonusThreshold: 5,               // Referrals for bonus
    bonusReward: 500,                // Bonus amount
  ),
)
```

## Best Practices

1. **Initialize Early**: Call `initialize()` in your app's `main()` function
2. **Set Identity**: Always set user identity after authentication
3. **Clear on Logout**: Call `clearUserIdentity()` when user logs out
4. **Handle Deep Links**: Listen to `referralDataStream` throughout app lifecycle
5. **Track Events**: Use Branch events for analytics and attribution
6. **Test Thoroughly**: Use test mode during development

## Troubleshooting

### Links not working

- Verify Branch Dashboard configuration
- Check associated domains (iOS)
- Validate AndroidManifest.xml entries

### Rewards not credited

- Ensure Cloud Function is deployed
- Check Firestore security rules
- Verify user authentication

### Deep links not detected

- Call `initialize()` early
- Check platform-specific setup
- Enable logging to debug

## License

Proprietary - Workern Internal Use Only
