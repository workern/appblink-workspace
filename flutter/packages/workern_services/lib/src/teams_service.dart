import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:workern_models/workern_models.dart';
import 'cloud_functions_service.dart';

class TeamsService {
  final CloudFunctionsService _functions;
  final FirebaseFirestore _firestore;

  TeamsService({
    CloudFunctionsService? functionsService,
    FirebaseFirestore? firestore,
  })  : _functions = functionsService ?? CloudFunctionsService(),
        _firestore = firestore ?? FirebaseFirestore.instance;

  /// Converts a workspaceId to the Firestore doc ID (matches backend logic).
  String _toWorkspaceDocId(String workspaceId) =>
      workspaceId.replaceAll('/', '--');

  /// Invite a user by email. Caller must be an owner of the workspace.
  Future<Map<String, dynamic>> inviteMember({
    required String appId,
    required String workspaceId,
    required String email,
    WorkspaceMemberRole role = WorkspaceMemberRole.member,
    List<String>? spaces,
  }) async {
    final result = await _functions.call('workspaces-invitemember', {
      'appId': appId,
      'workspaceId': workspaceId,
      'email': email,
      'role': role.name,
      if (spaces != null) 'spaces': spaces,
    });
    return Map<String, dynamic>.from(result as Map);
  }

  /// Remove a member (owners can remove anyone; members can leave themselves).
  Future<void> removeMember({
    required String appId,
    required String workspaceId,
    required String targetUid,
  }) async {
    await _functions.call('workspaces-removemember', {
      'appId': appId,
      'workspaceId': workspaceId,
      'targetUid': targetUid,
    });
  }

  /// Real-time stream of members for a workspace, ordered by joinedAt.
  Stream<List<WorkspaceMember>> watchMembers(String appId, String workspaceId) {
    final docId = _toWorkspaceDocId(workspaceId);
    return _firestore
        .collection('apps')
        .doc(appId)
        .collection('workspaces')
        .doc(docId)
        .collection('members')
        .orderBy('joinedAt')
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => WorkspaceMember.fromJson(
                  Map<String, dynamic>.from(doc.data()),
                ))
            .toList());
  }
}
