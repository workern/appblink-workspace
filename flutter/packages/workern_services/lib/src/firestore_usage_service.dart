import 'package:cloud_firestore/cloud_firestore.dart';

import 'firebase_usage_tracker.dart';

class FirestoreUsageService {
  FirestoreUsageService({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;
  final FirebaseUsageTracker _tracker = FirebaseUsageTracker.instance;

  String _entityFromPath(String path) {
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();
    if (segments.isEmpty) return 'unknown';
    return segments.length.isEven
        ? (segments[segments.length - 2])
        : (segments[segments.length - 1]);
  }

  Future<Map<String, dynamic>?> getDoc(String path) async {
    final snapshot = await _firestore.doc(path).get();
    final data = snapshot.data();
    _tracker.recordFirestoreRead(
      count: 1,
      bytes: _tracker.estimateBytes(data),
      entity: _entityFromPath(path),
    );
    return data;
  }

  Future<List<Map<String, dynamic>>> getCollection(
    String path, {
    Query<Map<String, dynamic>> Function(
            CollectionReference<Map<String, dynamic>> collection)?
        queryBuilder,
  }) async {
    final collection = _firestore.collection(path);
    final query = queryBuilder != null ? queryBuilder(collection) : collection;
    final snapshot = await query.get();
    final data = snapshot.docs.map((doc) => doc.data()).toList();
    _tracker.recordFirestoreRead(
      count: data.length,
      bytes: _tracker.estimateBytes(data),
      entity: _entityFromPath(path),
    );
    return data;
  }

  Future<DocumentReference<Map<String, dynamic>>> createDoc(
    String path,
    Map<String, dynamic> data,
  ) async {
    final ref = await _firestore.collection(path).add(data);
    _tracker.recordFirestoreCreate(
      count: 1,
      bytes: _tracker.estimateBytes(data),
      entity: _entityFromPath(path),
    );
    return ref;
  }

  Future<void> setDoc(
    String path,
    Map<String, dynamic> data, {
    bool merge = false,
  }) async {
    await _firestore.doc(path).set(data, SetOptions(merge: merge));
    _tracker.recordFirestoreCreate(
      count: 1,
      bytes: _tracker.estimateBytes(data),
      entity: _entityFromPath(path),
    );
  }

  Future<void> updateDoc(String path, Map<String, dynamic> data) async {
    await _firestore.doc(path).update(data);
    _tracker.recordFirestoreUpdate(
      count: 1,
      bytes: _tracker.estimateBytes(data),
      entity: _entityFromPath(path),
    );
  }

  Future<void> deleteDoc(String path) async {
    await _firestore.doc(path).delete();
    _tracker.recordFirestoreDelete(
      count: 1,
      entity: _entityFromPath(path),
    );
  }
}
