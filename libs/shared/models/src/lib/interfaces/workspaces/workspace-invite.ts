export type WorkspaceMemberRole = 'owner' | 'member' | 'admin';
export type WorkspaceFunctionalRole =
  | 'developer'
  | 'designer'
  | 'marketing'
  | 'qa'
  | 'content'
  | 'publisher';

export type WorkspaceCapability =
  | 'manage_workspace'
  | 'manage_members'
  | 'manage_billing'
  | 'manage_workspace_content'
  | 'manage_tasks'
  | 'manage_vibechecks'
  | 'apply_repo_changes'
  | 'upload_assets'
  | 'manage_branding_assets'
  | 'edit_store_listing'
  | 'manage_paywall_links'
  | 'manage_release_metadata'
  | 'publish_content';

/**
 * A pending or accepted invite to a workspace.
 * Written to apps/{appId}/invites/{inviteId} when the invitee has no Firebase account yet.
 * Status becomes 'accepted' (and a member doc is written) once they sign up.
 */
export interface WorkspaceInvite {
  id: string;
  appId: string;
  workspaceId: string;
  workspaceDocId: string;
  workspaceName: string;
  invitedEmail: string;
  invitedByUid: string;
  role: WorkspaceMemberRole;
  functionalRoles: WorkspaceFunctionalRole[];
  capabilities: WorkspaceCapability[];
  /** null means access to all spaces; string[] restricts to specific spaces */
  spaces: string[] | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

/**
 * A member doc stored at apps/{appId}/workspaces/{workspaceDocId}/members/{uid}.
 * Also mirrored in the user's membership index for discovery.
 */
export interface WorkspaceMember {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  role: WorkspaceMemberRole;
  functionalRoles: WorkspaceFunctionalRole[];
  capabilities: WorkspaceCapability[];
  /** null means access to all spaces; string[] restricts to specific spaces */
  spaces: string[] | null;
  joinedAt: string;
}
