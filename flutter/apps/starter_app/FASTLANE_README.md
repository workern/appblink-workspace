# Fastlane Quick Reference - Starter App

## 🚀 One-Click Publishing Commands

### Android (Google Play Store)

```bash
# Navigate to this directory first
cd flutter/apps/starter_app

# Build AAB
fastlane android build

# Upload to Internal Testing
fastlane android internal

# Upload to Alpha Track
fastlane android alpha

# Upload to Beta Track
fastlane android beta

# Upload to Production
fastlane android production
```

### iOS (App Store)

```bash
# Navigate to this directory first
cd flutter/apps/starter_app

# Build IPA
fastlane ios build

# Upload to TestFlight
fastlane ios beta

# Submit to App Store (manual release)
fastlane ios release

# Submit to App Store (auto-release)
fastlane ios production
```

## ⚙️ First-Time Setup Required

1. **Android:** Update `android/fastlane/Appfile` with your Google Play service account JSON path
2. **iOS:** Update `ios/fastlane/Appfile` with your Apple ID and Team IDs
3. **iOS:** Create `ios/fastlane/.env` from `.env.template` with your App Store Connect API key

See [FASTLANE_SETUP_GUIDE.md](../FASTLANE_SETUP_GUIDE.md) for detailed setup instructions.

## 📦 App Details

- **App Name:** Starter App
- **Android Package:** com.workern.starterApp
- **iOS Bundle:** com.workern.starterApp
