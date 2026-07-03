import 'package:flutter/material.dart';

/// A named color palette for theme testing.
class WorkernPalette {
  const WorkernPalette({required this.label, required this.seed});
  final String label;
  final Color seed;
}

/// Default set of palettes available for testing.
/// Index 0 is the "custom" slot — pass your own [ColorScheme] pair via
/// [WorkernThemeSwitcher.customLight] / [customDark] and set seed to null.
const defaultPalettes = [
  WorkernPalette(label: 'App Default', seed: Color(0x00000000)), // sentinel
  WorkernPalette(label: 'Emerald', seed: Color(0xFF059669)),
  WorkernPalette(label: 'Rose', seed: Color(0xFFE11D48)),
  WorkernPalette(label: 'Sky', seed: Color(0xFF0284C7)),
  WorkernPalette(label: 'Violet', seed: Color(0xFF7C3AED)),
  WorkernPalette(label: 'Amber', seed: Color(0xFFD97706)),
  WorkernPalette(label: 'Slate', seed: Color(0xFF475569)),
  WorkernPalette(label: 'Teal', seed: Color(0xFF0D9488)),
  WorkernPalette(label: 'Pink', seed: Color(0xFFDB2777)),
];

/// Signature for the builder that receives the resolved [ThemeMode] and
/// generated [ThemeData] pair so the host app can pass them to its app widget.
typedef ThemeSwitcherBuilder = Widget Function(
  ThemeMode themeMode,
  ThemeData lightTheme,
  ThemeData darkTheme,
);

/// Wraps the app root and owns all dev-theme state.
///
/// Usage:
/// ```dart
/// WorkernThemeSwitcher(
///   customLight: myAppLightTheme,
///   customDark: myAppDarkTheme,
///   builder: (themeMode, light, dark) => MaterialApp(
///     theme: light,
///     darkTheme: dark,
///     themeMode: themeMode,
///   ),
/// )
/// ```
///
/// To trigger switches wrap any widget with [WorkernThemeTrigger]:
/// - **Double-tap** → cycle Light / Dark / System
/// - **Long-press** → cycle color palette
class WorkernThemeSwitcher extends StatefulWidget {
  const WorkernThemeSwitcher({
    super.key,
    required this.builder,
    required this.customLight,
    required this.customDark,
    this.palettes = defaultPalettes,
    this.initialMode = ThemeMode.system,
  });

  final ThemeSwitcherBuilder builder;

  /// The app's real hand-tuned light theme — used when palette index == 0.
  final ThemeData customLight;

  /// The app's real hand-tuned dark theme — used when palette index == 0.
  final ThemeData customDark;

  /// Palette list. Index 0 is always the custom/default slot.
  final List<WorkernPalette> palettes;

  final ThemeMode initialMode;

  static WorkernThemeSwitcherState of(BuildContext context) {
    final state =
        context.findAncestorStateOfType<WorkernThemeSwitcherState>();
    assert(state != null, 'No WorkernThemeSwitcher found in widget tree');
    return state!;
  }

  @override
  State<WorkernThemeSwitcher> createState() => WorkernThemeSwitcherState();
}

class WorkernThemeSwitcherState extends State<WorkernThemeSwitcher> {
  late ThemeMode _themeMode;
  int _paletteIndex = 0;

  @override
  void initState() {
    super.initState();
    _themeMode = widget.initialMode;
  }

  void cycleThemeMode() {
    const modes = [ThemeMode.light, ThemeMode.dark];
    setState(() {
      _themeMode = modes[(modes.indexOf(_themeMode) + 1) % modes.length];
    });
    debugPrint('🎨 ThemeMode → $_themeMode');
  }

  void cyclePalette() {
    setState(() {
      _paletteIndex = (_paletteIndex + 1) % widget.palettes.length;
    });
    debugPrint('🎨 Palette → ${widget.palettes[_paletteIndex].label}');
  }

  ThemeData get _lightTheme {
    if (_paletteIndex == 0) return widget.customLight;
    final seed = widget.palettes[_paletteIndex].seed;
    final cs = ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.light);
    return widget.customLight.copyWith(colorScheme: cs, scaffoldBackgroundColor: cs.surface);
  }

  ThemeData get _darkTheme {
    if (_paletteIndex == 0) return widget.customDark;
    final seed = widget.palettes[_paletteIndex].seed;
    final cs = ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark);
    return widget.customDark.copyWith(colorScheme: cs, scaffoldBackgroundColor: cs.surface);
  }

  @override
  Widget build(BuildContext context) =>
      widget.builder(_themeMode, _lightTheme, _darkTheme);
}
