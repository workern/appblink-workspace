import 'dart:async';
import 'dart:convert';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class FirebaseUsageTracker {
  FirebaseUsageTracker._();

  static final FirebaseUsageTracker instance = FirebaseUsageTracker._();

  static const String _region = 'asia-south2';

  String _appId = '';
  int _firestoreReads = 0;
  int _firestoreCreates = 0;
  int _firestoreUpdates = 0;
  int _firestoreDeletes = 0;
  int _firestoreBandwidthBytes = 0;
  int _functionsCalls = 0;
  int _functionsBandwidthBytes = 0;
  int _functionsExecutionMs = 0;
  int _storageUploads = 0;
  int _storageDownloads = 0;
  int _storageDeletes = 0;
  int _storageUploadBytes = 0;
  int _storageDownloadBytes = 0;
  Map<String, int> _functionCallsByName = <String, int>{};
  Map<String, Map<String, int>> _entityBreakdown = <String, Map<String, int>>{};
  Timer? _flushTimer;

  void configure({required String appId}) {
    _appId = appId;
    _flushTimer ??= Timer.periodic(
      const Duration(seconds: 30),
      (_) => flush(source: 'flutter-interval'),
    );
  }

  int estimateBytes(dynamic payload) {
    if (payload == null) return 0;
    try {
      return utf8.encode(jsonEncode(payload)).length;
    } catch (_) {
      return 0;
    }
  }

  void recordFirestoreRead({int count = 1, int bytes = 0, String? entity}) {
    _firestoreReads += count;
    _firestoreBandwidthBytes += bytes;
    _bumpEntity(entity: entity, op: 'reads', count: count);
  }

  void recordFirestoreCreate({int count = 1, int bytes = 0, String? entity}) {
    _firestoreCreates += count;
    _firestoreBandwidthBytes += bytes;
    _bumpEntity(entity: entity, op: 'creates', count: count);
  }

  void recordFirestoreUpdate({int count = 1, int bytes = 0, String? entity}) {
    _firestoreUpdates += count;
    _firestoreBandwidthBytes += bytes;
    _bumpEntity(entity: entity, op: 'updates', count: count);
  }

  void recordFirestoreDelete({int count = 1, String? entity}) {
    _firestoreDeletes += count;
    _bumpEntity(entity: entity, op: 'deletes', count: count);
  }

  void recordFunctionCall({
    int count = 1,
    int bytes = 0,
    String? functionName,
  }) {
    _functionsCalls += count;
    _functionsBandwidthBytes += bytes;
    if (functionName != null && functionName.isNotEmpty) {
      _functionCallsByName[functionName] =
          (_functionCallsByName[functionName] ?? 0) + count;
    }
  }

  void recordFunctionExecution({int executionMs = 0}) {
    _functionsExecutionMs += executionMs;
  }

  void recordStorageUpload({int count = 1, int bytes = 0}) {
    _storageUploads += count;
    _storageUploadBytes += bytes;
  }

  void recordStorageDownload({int count = 1, int bytes = 0}) {
    _storageDownloads += count;
    _storageDownloadBytes += bytes;
  }

  void recordStorageDelete({int count = 1}) {
    _storageDeletes += count;
  }

  Map<String, int> snapshot() {
    return {
      'firestoreReads': _firestoreReads,
      'firestoreCreates': _firestoreCreates,
      'firestoreUpdates': _firestoreUpdates,
      'firestoreDeletes': _firestoreDeletes,
      'firestoreBandwidthBytes': _firestoreBandwidthBytes,
      'functionsCalls': _functionsCalls,
      'functionsBandwidthBytes': _functionsBandwidthBytes,
      'functionsExecutionMs': _functionsExecutionMs,
      'storageUploads': _storageUploads,
      'storageDownloads': _storageDownloads,
      'storageDeletes': _storageDeletes,
      'storageUploadBytes': _storageUploadBytes,
      'storageDownloadBytes': _storageDownloadBytes,
    };
  }

  Map<String, int> _drain() {
    final data = snapshot();
    _firestoreReads = 0;
    _firestoreCreates = 0;
    _firestoreUpdates = 0;
    _firestoreDeletes = 0;
    _firestoreBandwidthBytes = 0;
    _functionsCalls = 0;
    _functionsBandwidthBytes = 0;
    _functionsExecutionMs = 0;
    _storageUploads = 0;
    _storageDownloads = 0;
    _storageDeletes = 0;
    _storageUploadBytes = 0;
    _storageDownloadBytes = 0;
    return data;
  }

  String? _normalizeEntity(String? entity) {
    if (entity == null) return null;
    final normalized =
        entity.replaceAll(RegExp(r'[./#$\[\]]'), '_').trim().toLowerCase();
    return normalized.isEmpty ? null : normalized;
  }

  void _bumpEntity({
    required String? entity,
    required String op,
    required int count,
  }) {
    if (count <= 0) return;
    final normalized = _normalizeEntity(entity);
    if (normalized == null) return;
    final current = _entityBreakdown[normalized] ?? <String, int>{};
    current[op] = (current[op] ?? 0) + count;
    _entityBreakdown[normalized] = current;
  }

  Map<String, Map<String, int>> _cloneEntityBreakdown() {
    final clone = <String, Map<String, int>>{};
    _entityBreakdown.forEach((entity, ops) {
      clone[entity] = Map<String, int>.from(ops);
    });
    return clone;
  }

  void _mergeEntityBreakdown(Map<String, Map<String, int>> breakdown) {
    breakdown.forEach((entity, ops) {
      ops.forEach((op, count) {
        _bumpEntity(entity: entity, op: op, count: count);
      });
    });
  }

  Future<void> flush({String source = 'flutter'}) async {
    if (_appId.isEmpty) {
      return;
    }

    final metrics = _drain();
    final functionCallsByName = Map<String, int>.from(_functionCallsByName);
    final entityBreakdown = _cloneEntityBreakdown();
    _functionCallsByName = <String, int>{};
    _entityBreakdown = <String, Map<String, int>>{};
    final hasUsage = metrics.values.any((v) => v > 0);
    if (!hasUsage && functionCallsByName.isEmpty && entityBreakdown.isEmpty) {
      return;
    }

    try {
      final callable = FirebaseFunctions.instanceFor(region: _region)
          .httpsCallable('applicationusage-reportusage');
      await callable.call({
        'appId': _appId,
        'metrics': metrics,
        'functionCallsByName': functionCallsByName,
        'entityBreakdown': entityBreakdown,
        'source': source,
      });
    } catch (e) {
      debugPrint('❌ Failed to flush Firebase usage metrics: $e');
      _firestoreReads += metrics['firestoreReads'] ?? 0;
      _firestoreCreates += metrics['firestoreCreates'] ?? 0;
      _firestoreUpdates += metrics['firestoreUpdates'] ?? 0;
      _firestoreDeletes += metrics['firestoreDeletes'] ?? 0;
      _firestoreBandwidthBytes += metrics['firestoreBandwidthBytes'] ?? 0;
      _functionsCalls += metrics['functionsCalls'] ?? 0;
      _functionsBandwidthBytes += metrics['functionsBandwidthBytes'] ?? 0;
      _functionsExecutionMs += metrics['functionsExecutionMs'] ?? 0;
      _storageUploads += metrics['storageUploads'] ?? 0;
      _storageDownloads += metrics['storageDownloads'] ?? 0;
      _storageDeletes += metrics['storageDeletes'] ?? 0;
      _storageUploadBytes += metrics['storageUploadBytes'] ?? 0;
      _storageDownloadBytes += metrics['storageDownloadBytes'] ?? 0;
      functionCallsByName.forEach((functionName, count) {
        _functionCallsByName[functionName] =
            (_functionCallsByName[functionName] ?? 0) + count;
      });
      _mergeEntityBreakdown(entityBreakdown);
    }
  }
}

extension QuerySnapshotUsageTracker<T> on Stream<QuerySnapshot<T>> {
  Stream<QuerySnapshot<T>> trackUsage(String entity) {
    return map((snapshot) {
      FirebaseUsageTracker.instance.recordFirestoreRead(
        count: snapshot.docs.length,
        bytes: FirebaseUsageTracker.instance.estimateBytes(
          snapshot.docs.map((doc) => doc.data()).toList(),
        ),
        entity: entity,
      );
      return snapshot;
    });
  }
}

extension DocumentSnapshotUsageTracker<T> on Stream<DocumentSnapshot<T>> {
  Stream<DocumentSnapshot<T>> trackUsage(String entity) {
    return map((snapshot) {
      if (snapshot.exists) {
        FirebaseUsageTracker.instance.recordFirestoreRead(
          count: 1,
          bytes: FirebaseUsageTracker.instance.estimateBytes(snapshot.data()),
          entity: entity,
        );
      }
      return snapshot;
    });
  }
}

extension FutureDocumentSnapshotUsageTracker<T> on Future<DocumentSnapshot<T>> {
  Future<DocumentSnapshot<T>> trackUsage(String entity) async {
    final snapshot = await this;
    if (snapshot.exists) {
      FirebaseUsageTracker.instance.recordFirestoreRead(
        count: 1,
        bytes: FirebaseUsageTracker.instance.estimateBytes(snapshot.data()),
        entity: entity,
      );
    }
    return snapshot;
  }
}

extension FutureQuerySnapshotUsageTracker<T> on Future<QuerySnapshot<T>> {
  Future<QuerySnapshot<T>> trackUsage(String entity) async {
    final snapshot = await this;
    FirebaseUsageTracker.instance.recordFirestoreRead(
      count: snapshot.docs.length,
      bytes: FirebaseUsageTracker.instance.estimateBytes(
        snapshot.docs.map((doc) => doc.data()).toList(),
      ),
      entity: entity,
    );
    return snapshot;
  }
}
