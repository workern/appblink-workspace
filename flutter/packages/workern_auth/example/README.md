# Workern Auth Package Example

This example demonstrates how to integrate and use the `workern_auth` package in a Flutter application.

## Setup

1. Install dependencies:

```bash
flutter pub get
```

2. Configure Firebase:
   - Follow [Firebase Setup Guide](../README.md#firebase-setup)
   - Download your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

3. Run the app:

```bash
flutter run
```

## Files

- `main.dart` - App entry point with provider setup
- `home_screen.dart` - Home screen shown after login
- `firebase_options.dart` - Firebase configuration

## Features Demonstrated

- Login with email and password
- Sign up new accounts
- Google Sign-In
- Forgot password flow
- User profile display
- Sign out functionality

## Key Integration Points

### 1. Provider Setup

See how `AuthProvider` is initialized in `main.dart`

### 2. Navigation

See how to navigate between login and home screens

### 3. Auth State Handling

See how to listen to authentication state changes

### 4. Error Handling

See how to display and handle authentication errors
