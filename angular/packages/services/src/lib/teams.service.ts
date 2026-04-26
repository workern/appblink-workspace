import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceMember, WorkspaceMemberRole } from '@workern/models';
import { FirebaseFunctionsService } from './firebase-functions.service';
import { FirestoreService } from './firestore.service';
import { orderBy } from '@angular/fire/firestore';

export interface InviteMemberResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly fns = inject(FirebaseFunctionsService);
  private readonly firestoreService = inject(FirestoreService);

  /** Invite a user by email to a workspace. Caller must be an owner. */
  inviteMember(params: {
    appId: string;
    workspaceId: string;
    email: string;
    role?: WorkspaceMemberRole;
    spaces?: string[] | null;
  }): Promise<InviteMemberResult> {
    return this.fns.firebaseCall<typeof params, InviteMemberResult>(
      'teams-invitemember',
      params
    );
  }

  /** Remove a member (owner removes anyone; members can leave themselves). */
  removeMember(params: {
    appId: string;
    workspaceId: string;
    targetUid: string;
  }): Promise<void> {
    return this.fns.firebaseCall<typeof params, void>(
      'teams-removemember',
      params
    );
  }

  /**
   * Real-time stream of members for a workspace.
   * Resolves workspaceDocId from workspaceId in the same way the backend does
   * (replace all slashes with underscores).
   */
  watchMembers(
    appId: string,
    workspaceId: string
  ): Observable<WorkspaceMember[]> {
    const workspaceDocId = workspaceId.replace(/\//g, '_');
    const path = `apps/${appId}/workspaces/${workspaceDocId}/members`;
    return this.firestoreService.getCollection<WorkspaceMember>(
      path,
      orderBy('joinedAt', 'asc')
    );
  }
}
