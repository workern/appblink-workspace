import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { WorkspaceMember, WorkspaceMemberRole } from '@workern/models';
import { AuthService, SnackbarService, TeamsService } from '@workern/services';

import { HlmAvatarImports } from '@spartan/components/avatar';
import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmCardImports } from '@spartan/components/card';
import { HlmInputImports } from '@spartan/components/input';
import { HlmLabelImports } from '@spartan/components/label';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmSkeletonImports } from '@spartan/components/skeleton';
import { HlmIconImports } from '@spartan/components/icon';
import { HlmAlertDialogImports } from '@spartan/components/alert-dialog';
import { HlmSheetImports } from '@spartan/components/sheet';
import { HlmSelectImports } from '@spartan/components/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import {
  lucideUserPlus,
  lucideUserMinus,
  lucideUsers,
  lucideCrown,
  lucideUser,
  lucideX
} from '@ng-icons/lucide';
import { provideIcons } from '@ng-icons/core';

@Component({
  selector: 'wn-workspace-teams',
  standalone: true,

  imports:[],
  // imports: [
  //   CommonModule,
  //   FormsModule,
  //   HlmAvatarImports,
  //   HlmBadgeImports,
  //   HlmButtonImports,
  //   HlmCardImports,
  //   HlmInputImports,
  //   HlmLabelImports,
  //   HlmSeparatorImports,
  //   HlmSkeletonImports,
  //   HlmAlertDialogImports,
  //   HlmSheetImports,
  //   HlmSelectImports,
  //   BrnSelectImports,
  //   ...HlmIconImports
  // ],
  // viewProviders: [
  //   provideIcons({
  //     lucideUserPlus,
  //     lucideUserMinus,
  //     lucideUsers,
  //     lucideCrown,
  //     lucideUser,
  //     lucideX
  //   })
  // ],
  templateUrl: './workspace-teams.component.html',
  styleUrl: './workspace-teams.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceTeamsComponent {
  // private readonly teamsService = inject(TeamsService);
  // private readonly authService = inject(AuthService);
  // private readonly snackbar = inject(SnackbarService);

  // readonly appId = input.required<string>();
  // readonly workspaceId = input.required<string>();

  // private readonly params = computed(() => ({
  //   appId: this.appId(),
  //   workspaceId: this.workspaceId()
  // }));

  // readonly members = toSignal(
  //   toObservable(this.params).pipe(
  //     switchMap(({ appId, workspaceId }) =>
  //       this.teamsService.watchMembers(appId, workspaceId)
  //     )
  //   ),
  //   { initialValue: null }
  // );

  // protected readonly isLoading = computed(() => this.members() === null);

  // protected readonly currentUid = computed(
  //   () => this.authService.currentUser()?.uid ?? ''
  // );

  // protected readonly isCurrentUserOwner = computed(() => {
  //   const uid = this.currentUid();
  //   const list = this.members();
  //   if (!list || !uid) return false;
  //   return list.some((m) => m.uid === uid && m.role === 'owner');
  // });

  // // ── Invite sheet ──────────────────────────────────────────────
  // protected readonly showInviteSheet = signal(false);
  // protected readonly inviteEmail = signal('');
  // protected readonly inviteRole = signal<WorkspaceMemberRole>('member');
  // protected readonly isInviting = signal(false);

  // // ── Remove dialog ─────────────────────────────────────────────
  // protected readonly memberToRemove = signal<WorkspaceMember | null>(null);
  // protected readonly isRemoving = signal(false);

  // protected openInviteSheet(): void {
  //   this.inviteEmail.set('');
  //   this.inviteRole.set('member');
  //   this.showInviteSheet.set(true);
  // }

  // protected async submitInvite(): Promise<void> {
  //   const email = this.inviteEmail().trim();
  //   if (!email) return;
  //   this.isInviting.set(true);
  //   try {
  //     await this.teamsService.inviteMember({
  //       appId: this.appId(),
  //       workspaceId: this.workspaceId(),
  //       email,
  //       role: this.inviteRole()
  //     });
  //     this.snackbar.success('Invite sent!');
  //     this.showInviteSheet.set(false);
  //   } catch (err: any) {
  //     this.snackbar.error(err?.message ?? 'Failed to send invite');
  //   } finally {
  //     this.isInviting.set(false);
  //   }
  // }

  // protected confirmRemove(member: WorkspaceMember): void {
  //   this.memberToRemove.set(member);
  // }

  // protected cancelRemove(): void {
  //   this.memberToRemove.set(null);
  // }

  // protected onSheetStateChanged(state: string): void {
  //   if (state === 'closed') {
  //     this.showInviteSheet.set(false);
  //   }
  // }

  // protected async executeRemove(): Promise<void> {
  //   const member = this.memberToRemove();
  //   if (!member) return;
  //   this.isRemoving.set(true);
  //   try {
  //     await this.teamsService.removeMember({
  //       appId: this.appId(),
  //       workspaceId: this.workspaceId(),
  //       targetUid: member.uid
  //     });
  //     const isSelf = member.uid === this.currentUid();
  //     this.snackbar.success(
  //       isSelf ? 'You have left the workspace' : 'Member removed'
  //     );
  //   } catch (err: any) {
  //     this.snackbar.error(err?.message ?? 'Failed to remove member');
  //   } finally {
  //     this.isRemoving.set(false);
  //     this.memberToRemove.set(null);
  //   }
  // }

  // protected initials(member: WorkspaceMember): string {
  //   const name = member.displayName ?? member.email ?? '?';
  //   return name.slice(0, 2).toUpperCase();
  // }

  // protected isOwner(member: WorkspaceMember): boolean {
  //   return member.role === 'owner';
  // }

  // protected isSelf(member: WorkspaceMember): boolean {
  //   return member.uid === this.currentUid();
  // }

  // protected canActOn(member: WorkspaceMember): boolean {
  //   return this.isCurrentUserOwner() || this.isSelf(member);
  // }

  // protected actionLabel(member: WorkspaceMember): string {
  //   return this.isSelf(member) ? 'Leave' : 'Remove';
  // }
}
