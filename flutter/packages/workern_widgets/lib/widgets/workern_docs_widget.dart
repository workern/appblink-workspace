import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

/// Inline embeddable documentation widget (shared across all Workern apps).
///
/// Loads a single markdown asset and renders it inline — no [Scaffold] or
/// app-bar. Ideal for embedding a doc page directly inside another screen.
///
/// Example usage:
/// ```dart
/// WorkernDocsWidget(
///   assetPath: 'assets/docs/features/onboarding.md',
/// )
/// ```
class WorkernDocsWidget extends StatefulWidget {
  /// Asset path, e.g. 'assets/docs/features/onboarding.md'.
  final String assetPath;

  /// Optional fixed height. When null, the widget sizes to its content.
  final double? height;

  const WorkernDocsWidget({
    super.key,
    required this.assetPath,
    this.height,
  });

  @override
  State<WorkernDocsWidget> createState() => _WorkernDocsWidgetState();
}

class _WorkernDocsWidgetState extends State<WorkernDocsWidget> {
  String? _content;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final text = await rootBundle.loadString(widget.assetPath);
      if (mounted) setState(() { _content = text; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }
    if (_content == null || _content!.isEmpty) return const SizedBox.shrink();

    final md = Markdown(
      data: _content!,
      selectable: true,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
    );

    return widget.height != null
        ? SizedBox(height: widget.height, child: md)
        : md;
  }
}
