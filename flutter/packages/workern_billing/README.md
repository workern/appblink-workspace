# Workern Billing

A reusable Flutter package for handling in-app purchases on Google Play Store and Apple App Store.

## Features

- ✅ Support for both iOS and Android
- ✅ Subscription and one-time purchases
- ✅ Customizable subscription screen UI
- ✅ Restore purchases functionality
- ✅ Easy integration with existing apps
- ✅ Purchase state management

## Installation

Add this to your app's `pubspec.yaml`:

```yaml
dependencies:
  workern_billing:
    path: ../../packages/workern_billing
```

## Platform Setup

### Android (Google Play)

1. Create in-app products in Google Play Console
2. Add billing permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### iOS (App Store)

1. Create in-app products in App Store Connect
2. Enable In-App Purchase capability in Xcode

## Usage

### 1. Initialize Billing Service

```dart
import 'package:workern_billing/workern_billing.dart';

final billingService = BillingService(
  productIds: [
    'your_annual_subscription_id',
    'your_weekly_subscription_id',
  ],
);
```

### 2. Show Subscription Screen with Dynamic Pricing

**Recommended: Use dynamic pricing from stores**

```dart
// Wait for products to load
await billingService.loadProducts();

// Build subscription products with real store prices
final products = billingService.buildSubscriptionProducts(
  productTitles: {
    'your_annual_subscription_id': 'Annual',
    'your_weekly_subscription_id': 'Weekly',
  },
  defaultProductId: 'your_annual_subscription_id',
);

final result = await Navigator.push<PurchaseResult>(
  context,
  MaterialPageRoute(
    builder: (context) => SubscriptionScreen(
      title: 'What you get',
      features: const [
        SubscriptionFeature(text: 'Feature 1'),
        SubscriptionFeature(text: 'Feature 2'),
        SubscriptionFeature(text: 'Feature 3'),
      ],
      products: products, // Dynamic pricing from stores!
      billingService: billingService,
      primaryColor: Colors.pink,
      privacyPolicyUrl: 'https://yourapp.com/privacy',
      termsOfUseUrl: 'https://yourapp.com/terms',
    ),
  ),
);

if (result != null ; result.isSuccess) {
  // User successfully purchased subscription
  print('Purchase successful: ${result.productId}');
}
```

**Alternative: Manual pricing (not recommended)**

```dart
final result = await Navigator.push<PurchaseResult>(
  context,
  MaterialPageRoute(
    builder: (context) => SubscriptionScreen(
      title: 'What you get',
      features: const [
        SubscriptionFeature(text: 'Feature 1'),
        SubscriptionFeature(text: 'Feature 2'),
        SubscriptionFeature(text: 'Feature 3'),
      ],
      products: const [
        SubscriptionProduct(
          id: 'your_annual_subscription_id',
          title: 'Annual',
          price: '₹1,999',
          pricePerUnit: '₹38.44 / week',
          badge: 'Save 88%',
          isDefault: true,
        ),
        SubscriptionProduct(
          id: 'your_weekly_subscription_id',
          title: 'Weekly',
          price: '₹499',
        ),
      ],
      billingService: billingService,
      primaryColor: Colors.pink,
      privacyPolicyUrl: 'https://yourapp.com/privacy',
      termsOfUseUrl: 'https://yourapp.com/terms',
    ),
  ),
);
```

### 3. Listen to Purchase Updates

```dart
billingService.purchaseUpdates.listen((result) {
  if (result.isSuccess) {
    // Handle successful purchase
  } else if (result.hasError) {
    // Handle error
    print('Error: ${result.errorMessage}');
  }
});
```

### 4. Restore Purchases

```dart
await billingService.restorePurchases();
```

## Models

### SubscriptionProduct

Represents a subscription product with:

- `id`: Product SKU from store
- `title`: Display title (e.g., "Annual", "Weekly")
- `price`: Formatted price (e.g., "₹1,999")
- `pricePerUnit`: Price breakdown (e.g., "₹38.44 / week")
- `badge`: Optional badge text (e.g., "Save 88%", "Most Profitable")
- `isDefault`: Whether this product is selected by default

### SubscriptionFeature

Represents a feature in the subscription screen:

- `text`: Feature description
- `isHighlighted`: Whether to highlight this feature

### PurchaseResult

Result of a purchase operation:

- `status`: Success, error, cancelled, pending, or restored
- `productId`: The purchased product ID
- `errorMessage`: Error message if failed

## Testing

### Android Testing

Use test cards provided by Google Play Console for testing purchases.

### iOS Testing

1. Create a sandbox tester account in App Store Connect
2. Sign out of App Store on device
3. Use sandbox account when prompted during purchase

## Important Notes

1. **Product IDs**: Make sure product IDs in code match those created in Play Console and App Store Connect
2. **Backend Verification**: In production, verify purchases with your backend server
3. **Subscription Status**: Implement proper subscription status checking with your backend
4. **Testing**: Always test thoroughly on real devices before release

## Example Integration

See the Save Nest app for a complete integration example:

- `flutter/apps/smart_save/lib/providers/billing_provider.dart`
- `flutter/apps/smart_save/lib/screens/saves_screen.dart`

## License

Private package for Workern projects.
