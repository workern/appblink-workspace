import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workern_localization/workern_localization.dart';

/// A drop-down widget that lets the user switch the app language.
///
/// Reads and writes [localeProvider] from `workern_localization`.
///
/// **Minimal usage** (e.g. inside a settings screen):
/// ```dart
/// const LanguageSwitcherWidget()
/// ```
///
/// **With a label**:
/// ```dart
/// LanguageSwitcherWidget(showLabel: true)
/// ```
class LanguageSwitcherWidget extends ConsumerWidget {
  const LanguageSwitcherWidget({super.key, this.showLabel = false});

  /// Whether to show a "Language" label above the dropdown.
  final bool showLabel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);

    final items = WorkernLocales.all
        .map(
          (locale) => DropdownMenuItem<Locale>(
            value: locale,
            child: Text(_localeName(locale.languageCode)),
          ),
        )
        .toList();

    final dropdown = DropdownButton<Locale>(
      value: currentLocale,
      underline: const SizedBox.shrink(),
      borderRadius: BorderRadius.circular(8),
      items: items,
      onChanged: (locale) {
        if (locale != null) {
          ref.read(localeProvider.notifier).setLocale(locale);
        }
      },
    );

    if (!showLabel) return dropdown;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Language',
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        dropdown,
      ],
    );
  }

  static String _localeName(String code) {
    const names = {
      'en': 'English',
      'hi': 'हिन्दी',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'zh': '中文',
      'ar': 'العربية',
      'pt': 'Português',
    };
    return names[code] ?? code.toUpperCase();
  }
}
