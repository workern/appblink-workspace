import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SpaceMember } from '@workern/models';

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

export interface MemberRoleOption {
  value: string;
  label: string;
}

@Component({
  selector: 'wn-workspace-teams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSeparatorImports,
    HlmSkeletonImports,
    HlmAlertDialogImports,
    HlmSheetImports,
    HlmSelectImports,
    BrnSelectImports,
    ...HlmIconImports
  ],
  viewProviders: [
    provideIcons({
      lucideUserPlus,
      lucideUserMinus,
      lucideUsers,
      lucideCrown,
      lucideUser,
      lucideX
    })
  ],
  templateUrl: './workspace-teams.component.html',
  styleUrl: './workspace-teams.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceTeamsComponent {
  readonly members = input.required<any[]>();
  readonly availableRoles = input.required<MemberRoleOption[]>();
  readonly currentUid = input.required<string>();
  readonly isLoading = input<boolean>(false);
  readonly ownerRoleValue = input<string>('OWNER');
  readonly roleField = input<string>('role');
  readonly isInviting = input<boolean>(false);
  readonly isRemoving = input<boolean>(false);

  readonly invite = output<{ email: string; role: string }>();
  readonly updateRole = output<{ targetUid: string; newRole: string }>();
  readonly remove = output<string>();

  protected memberRole(member: any): string {
    return member[this.roleField()] || member.role;
  }

  protected readonly isCurrentUserOwner = computed(() => {
    const uid = this.currentUid();
    const list = this.members();
    if (!list || !uid) return false;
    return list.some((m: any) => this.memberId(m) === uid && this.memberRole(m) === this.ownerRoleValue());
  });

  // ── Invite sheet ──────────────────────────────────────────────
  protected readonly showInviteSheet = signal(false);
  protected readonly inviteEmail = signal('');
  protected readonly inviteRole = signal<string>('');

  // ── Remove dialog ─────────────────────────────────────────────
  protected readonly memberToRemove = signal<any | null>(null);

  protected openInviteSheet(): void {
    this.inviteEmail.set('');
    const roles = this.availableRoles();
    this.inviteRole.set(roles.length > 0 ? roles[roles.length - 1].value : '');
    this.showInviteSheet.set(true);
  }

  protected submitInvite(): void {
    const email = this.inviteEmail().trim();
    if (!email) return;
    this.invite.emit({ email, role: this.inviteRole() });
    this.showInviteSheet.set(false);
  }

  protected confirmRemove(member: any): void {
    this.memberToRemove.set(member);
  }

  protected cancelRemove(): void {
    this.memberToRemove.set(null);
  }

  protected onSheetStateChanged(state: string): void {
    if (state === 'closed') {
      this.showInviteSheet.set(false);
    }
  }

  protected executeRemove(): void {
    const member = this.memberToRemove();
    if (!member) return;
    this.remove.emit(this.memberId(member));
    this.memberToRemove.set(null);
  }

  protected changeRole(member: any, newRole: string): void {
     if(this.memberRole(member) !== newRole) {
         this.updateRole.emit({ targetUid: this.memberId(member), newRole });
     }
  }

  protected getRoleLabel(roleValue: string): string {
    const role = this.availableRoles().find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  protected memberId(member: any): string {
    return member.uid ?? member.id ?? '?';
  }

  protected memberName(member: any): string {
    return member.displayName ?? member.info?.name ?? this.memberEmail(member) ?? this.memberId(member);
  }

  protected memberEmail(member: any): string | undefined {
    return member.email ?? member.info?.email;
  }

  protected memberPhoto(member: any): string | undefined {
    return member.photoUrl ?? member.info?.photoURL ?? member.info?.photoUrl;
  }

  protected initials(member: any): string {
    const name = this.memberName(member);
    return name.slice(0, 2).toUpperCase();
  }

  protected isOwner(member: any): boolean {
    return this.memberRole(member) === this.ownerRoleValue();
  }

  protected isSelf(member: any): boolean {
    return this.memberId(member) === this.currentUid();
  }

  protected canActOn(member: any): boolean {
    return this.isCurrentUserOwner() || this.isSelf(member);
  }

  protected actionLabel(member: any): string {
    return this.isSelf(member) ? 'Leave' : 'Remove';
  }
}
