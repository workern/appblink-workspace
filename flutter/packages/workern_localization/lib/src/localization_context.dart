import 'package:flutter/widgets.dart';

/// Convenience extension so widgets can call `context.l10n` instead of
/// `AppLocalizations.of(context)!`.
///
/// Each app defines its own concrete type alias:
/// ```dart
/// // In lib/i18n/localization.dart of each app:
/// import 'app_localizations.dart'; // generated
/// export 'package:workern_localization/workern_localization.dart';
///
/// extension AppLocalizationContext on BuildContext {
///   AppLocalizations get l10n => AppLocalizations.of(this)!;
/// }
/// ```
///
/// This base extension just provides the helper pattern documentation.
/// Apps copy the snippet above and replace [AppLocalizations] with their own
/// generated class.
extension LocalizationContextBase on BuildContext {
  /// Returns the [Localizations] object of type [T] for this context.
  /// Prefer using your app's typed `.l10n` extension over this directly.
  T localizationsOf<T>(Type type) {
    return Localizations.of<T>(this, type)!;
  }
}
