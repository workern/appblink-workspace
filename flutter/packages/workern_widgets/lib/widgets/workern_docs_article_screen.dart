import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

/// Reusable markdown article screen (shared across all Workern apps).
///
/// Loads a markdown file from Flutter assets and renders it with
/// [flutter_markdown]. Derives the app-bar title from the asset path unless
/// [title] is provided.
///
/// Example usage:
/// ```dart
/// WorkernDocsArticleScreen(
///   assetPath: 'assets/docs/features/orders-screen.md',
/// )
/// ```
class WorkernDocsArticleScreen extends StatefulWidget {
  /// Asset path, e.g. 'assets/docs/features/orders-screen.md'.
  final String assetPath;

  /// Optional explicit title shown in the app bar.
  final String? title;

  const WorkernDocsArticleScreen({
    super.key,
    required this.assetPath,
    this.title,
  });

  @override
  State<WorkernDocsArticleScreen> createState() =>
      _WorkernDocsArticleScreenState();
}

class _WorkernDocsArticleScreenState extends State<WorkernDocsArticleScreen> {
  String? _content;
  bool _loading = true;
  bool _error = false;

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
      if (mounted) setState(() { _loading = false; _error = true; });
    }
  }

  String _deriveTitle(String assetPath) {
    final name = assetPath.split('/').last.replaceAll('.md', '');
    return name
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : w)
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final appBarTitle = widget.title ?? _deriveTitle(widget.assetPath);
    return Scaffold(
      appBar: AppBar(title: Text(appBarTitle)),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error) {
      return const Center(child: Text('Documentation page not found.'));
    }
    return Markdown(
      data: _content ?? '',
      selectable: true,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    );
  }
}
