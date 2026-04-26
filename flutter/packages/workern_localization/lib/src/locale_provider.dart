import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kLangKey = 'workern_lang';

/// Riverpod provider that holds the currently selected [Locale].
///
/// Watch it in your root widget and pass the value to [MaterialApp.locale]:
/// ```dart
/// class MyApp extends ConsumerWidget {
///   @override
///   Widget build(BuildContext context, WidgetRef ref) {
///     final locale = ref.watch(localeProvider);
///     return MaterialApp.router(
///       locale: locale,
///       supportedLocales: WorkernLocales.all,
///       localizationsDelegates: [...],
///       routerConfig: router,
///     );
///   }
/// }
/// ```
final localeProvider = NotifierProvider<LocaleNotifier, Locale>(
  LocaleNotifier.new,
);

class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() {
    _loadSaved();
    return const Locale('en');
  }

  Future<void> _loadSaved() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_kLangKey);
      if (saved != null) {
        state = Locale(saved);
      }
    } catch (_) {
      // Ignore — defaults to English
    }
  }

  /// Switch the app locale and persist the choice.
  Future<void> setLocale(Locale locale) async {
    state = locale;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kLangKey, locale.languageCode);
    } catch (_) {}
  }
}

/// Convenience helper — call from anywhere you have a [WidgetRef].
///
/// ```dart
/// ElevatedButton(
///   onPressed: () => setLocale(ref, const Locale('hi')),
///   child: Text('हिन्दी'),
/// )
/// ```
Future<void> setLocale(WidgetRef ref, Locale locale) =>
    ref.read(localeProvider.notifier).setLocale(locale);
