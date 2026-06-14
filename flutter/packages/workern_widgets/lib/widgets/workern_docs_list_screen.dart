import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'workern_docs_article_screen.dart';

/// Reusable documentation browser screen (shared across all Workern apps).
///
/// Loads an index from `assets/docs/manifest.json` and presents each entry
/// as a tappable tile that navigates to [WorkernDocsArticleScreen].
///
/// The manifest must be a JSON array of objects with at least:
///   `title` (String), `assetPath` (String), `summary` (String, optional).
///
/// Example usage:
/// ```dart
/// Navigator.push(context, MaterialPageRoute(
///   builder: (_) => const WorkernDocsListScreen(),
/// ));
/// ```
class WorkernDocsListScreen extends StatefulWidget {
  /// Path to the manifest file. Defaults to 'assets/docs/manifest.json'.
  final String manifestAssetPath;

  /// App-bar title. Defaults to 'Documentation'.
  final String title;

  const WorkernDocsListScreen({
    super.key,
    this.manifestAssetPath = 'assets/docs/manifest.json',
    this.title = 'Documentation',
  });

  @override
  State<WorkernDocsListScreen> createState() => _WorkernDocsListScreenState();
}

class _WorkernDocsListScreenState extends State<WorkernDocsListScreen> {
  List<_DocEntry> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadManifest();
  }

  Future<void> _loadManifest() async {
    try {
      final raw = await rootBundle.loadString(widget.manifestAssetPath);
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      if (mounted) {
        setState(() {
          _entries = list.map(_DocEntry.fromJson).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _entries.isEmpty
          ? const Center(child: Text('No docs available.'))
          : ListView.builder(
              itemCount: _entries.length,
              itemBuilder: (ctx, i) {
                final e = _entries[i];
                return ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: Text(e.title),
                  subtitle: e.summary != null ? Text(e.summary!) : null,
                  onTap: () => Navigator.push(
                    ctx,
                    MaterialPageRoute(
                      builder: (_) => WorkernDocsArticleScreen(
                        assetPath: e.assetPath,
                        title: e.title,
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _DocEntry {
  final String title;
  final String assetPath;
  final String? summary;

  const _DocEntry({
    required this.title,
    required this.assetPath,
    this.summary,
  });

  factory _DocEntry.fromJson(Map<String, dynamic> json) => _DocEntry(
        title: json['title'] as String? ?? 'Untitled',
        assetPath: json['assetPath'] as String,
        summary: json['summary'] as String?,
      );
}
