import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

/// Central registry for all locales supported by Workern apps.
///
/// To add a new language:
/// 1. Add its [Locale] to [all] here.
/// 2. Create `lib/i18n/app_<code>.arb` in each app (the VS Code extension can
///    auto-generate this via the "Localization → Auto-Translate" action).
/// 3. Run `flutter gen-l10n` in each app.
class WorkernLocales {
  const WorkernLocales._();

  /// All locales supported by Workern apps.
  /// This is the single source of truth — updating this list is all you need
  /// to add a new language (the extension's auto-translate watcher picks it up).
  static const List<Locale> all = <Locale>[
    Locale('en'), // English  — base / source language
    Locale('hi'), // Hindi
    Locale('es'), // Spanish
    Locale('fr'), // French
    Locale('de'), // German
    Locale('ja'), // Japanese
    Locale('zh'), // Chinese (Simplified)
    Locale('ar'), // Arabic
    Locale('pt'), // Portuguese
  ];

  /// Language codes that the Gemini auto-translate watcher will generate
  /// translations for (everything except the base English locale).
  static List<String> get targetLanguageCodes =>
      all.where((l) => l.languageCode != 'en').map((l) => l.languageCode).toList();

  /// The three Flutter-global localization delegates required by every app.
  /// Always include these alongside your app's own `AppLocalizations.delegate`.
  static const List<LocalizationsDelegate<dynamic>> globalDelegates = <LocalizationsDelegate<dynamic>>[
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];
}
