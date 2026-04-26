# Workern Auth Package Tests

## Running Tests

```bash
flutter test
```

## Test Coverage

Tests should cover:

- User model serialization/deserialization
- AuthService authentication methods
- AuthProvider state management
- Error handling in all flows
- Edge cases and validation

## Test Structure

```
test/
├── models/
│   └── user_model_test.dart
├── services/
│   └── auth_service_test.dart
├── providers/
│   └── auth_provider_test.dart
└── widgets/
    └── login_widgets_test.dart
```

Note: Tests require Firebase emulator setup for full integration testing.
