/// workern_localization
///
/// Drop-in localization setup for every Workern Flutter app.
///
/// Usage in MaterialApp:
/// ```dart
/// import 'package:workern_localization/workern_localization.dart';
///
/// MaterialApp(
///   supportedLocales: WorkernLocales.all,
///   localizationsDelegates: [
///     AppLocalizations.delegate,          // your app's own ARB delegate
///     ...WorkernLocales.globalDelegates,  // Material + Cupertino + Widgets
///   ],
/// )
/// ```

export 'src/supported_locales.dart';
export 'src/localization_context.dart';
export 'src/locale_provider.dart';
