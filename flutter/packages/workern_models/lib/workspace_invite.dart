enum WorkspaceMemberRole { owner, member }

/// A pending or accepted invite to a workspace.
/// Written to apps/{appId}/invites/{inviteId} when the invitee has no
/// Firebase account yet. Status becomes 'accepted' once they sign up.
class WorkspaceInvite {
  final String id;
  final String appId;
  final String workspaceId;
  final String workspaceDocId;
  final String workspaceName;
  final String invitedEmail;
  final String invitedByUid;
  final WorkspaceMemberRole role;

  /// null means access to all spaces; a list restricts to specific spaces.
  final List<String>? spaces;

  final String status; // 'pending' | 'accepted' | 'declined'
  final String createdAt;
  final String updatedAt;

  WorkspaceInvite({
    required this.id,
    required this.appId,
    required this.workspaceId,
    required this.workspaceDocId,
    required this.workspaceName,
    required this.invitedEmail,
    required this.invitedByUid,
    required this.role,
    this.spaces,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WorkspaceInvite.fromJson(Map<String, dynamic> json) {
    return WorkspaceInvite(
      id: json['id'] ?? '',
      appId: json['appId'] ?? '',
      workspaceId: json['workspaceId'] ?? '',
      workspaceDocId: json['workspaceDocId'] ?? '',
      workspaceName: json['workspaceName'] ?? '',
      invitedEmail: json['invitedEmail'] ?? '',
      invitedByUid: json['invitedByUid'] ?? '',
      role: json['role'] == 'owner'
          ? WorkspaceMemberRole.owner
          : WorkspaceMemberRole.member,
      spaces: json['spaces'] != null
          ? List<String>.from(json['spaces'] as List)
          : null,
      status: json['status'] ?? 'pending',
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'appId': appId,
    'workspaceId': workspaceId,
    'workspaceDocId': workspaceDocId,
    'workspaceName': workspaceName,
    'invitedEmail': invitedEmail,
    'invitedByUid': invitedByUid,
    'role': role.name,
    'spaces': spaces,
    'status': status,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };
}

/// A member doc stored at
/// apps/{appId}/workspaces/{workspaceDocId}/members/{uid}.
class WorkspaceMember {
  final String uid;
  final String? email;
  final String? displayName;
  final String? photoUrl;
  final WorkspaceMemberRole role;

  /// null means access to all spaces; a list restricts to specific spaces.
  final List<String>? spaces;

  final String joinedAt;

  WorkspaceMember({
    required this.uid,
    this.email,
    this.displayName,
    this.photoUrl,
    required this.role,
    this.spaces,
    required this.joinedAt,
  });

  factory WorkspaceMember.fromJson(Map<String, dynamic> json) {
    return WorkspaceMember(
      uid: json['uid'] ?? '',
      email: json['email'] as String?,
      displayName: json['displayName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      role: json['role'] == 'owner'
          ? WorkspaceMemberRole.owner
          : WorkspaceMemberRole.member,
      spaces: json['spaces'] != null
          ? List<String>.from(json['spaces'] as List)
          : null,
      joinedAt: json['joinedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'uid': uid,
    'email': email,
    'displayName': displayName,
    'photoUrl': photoUrl,
    'role': role.name,
    'spaces': spaces,
    'joinedAt': joinedAt,
  };
}
