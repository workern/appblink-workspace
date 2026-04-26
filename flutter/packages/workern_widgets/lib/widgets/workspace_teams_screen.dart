import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:workern_models/workern_models.dart';
import 'package:workern_services/workern_services.dart';
import 'workern_skeleton_loader.dart';

part 'workspace_teams_screen_widgets.dart';

/// A reusable team management screen for any app that supports workspaces.
///
/// Usage:
/// ```dart
/// WorkspaceTeamsScreen(
///   appId: 'app-blink',
///   workspaceId: 'my-workspace-id',
///   currentUserUid: authService.uid,
/// )
/// ```
class WorkspaceTeamsScreen extends ConsumerStatefulWidget {
  final String appId;
  final String workspaceId;
  final String currentUserUid;

  const WorkspaceTeamsScreen({
    super.key,
    required this.appId,
    required this.workspaceId,
    required this.currentUserUid,
  });

  @override
  ConsumerState<WorkspaceTeamsScreen> createState() =>
      _WorkspaceTeamsScreenState();
}

class _WorkspaceTeamsScreenState extends ConsumerState<WorkspaceTeamsScreen> {
  final _teamsService = TeamsService();

  // ── Invite form ───────────────────────────────────────────────
  final _inviteEmailController = TextEditingController();
  WorkspaceMemberRole _inviteRole = WorkspaceMemberRole.member;
  bool _isInviting = false;

  // ── Remove dialog ─────────────────────────────────────────────
  bool _isRemoving = false;

  @override
  void dispose() {
    _inviteEmailController.dispose();
    super.dispose();
  }

  bool _isOwner(List<WorkspaceMember> members) => members.any(
    (m) =>
        m.uid == widget.currentUserUid && m.role == WorkspaceMemberRole.owner,
  );

  // ── Invite ────────────────────────────────────────────────────
  void _showInviteSheet(BuildContext context) {
    _inviteEmailController.clear();
    _inviteRole = WorkspaceMemberRole.member;
    showShadSheet(
      side: ShadSheetSide.right,
      context: context,
      builder: (ctx) => _InviteSheet(
        emailController: _inviteEmailController,
        initialRole: _inviteRole,
        isInviting: _isInviting,
        onRoleChanged: (r) => setState(() => _inviteRole = r),
        onSubmit: () => _submitInvite(ctx),
      ),
    );
  }

  Future<void> _submitInvite(BuildContext sheetContext) async {
    final email = _inviteEmailController.text.trim();
    if (email.isEmpty) return;
    final navigator = Navigator.of(sheetContext);
    setState(() => _isInviting = true);
    try {
      await _teamsService.inviteMember(
        appId: widget.appId,
        workspaceId: widget.workspaceId,
        email: email,
        role: _inviteRole,
      );
      if (mounted) {
        navigator.pop();
        ShadToaster.of(
          context,
        ).show(const ShadToast(description: Text('Invite sent!')));
      }
    } catch (e) {
      if (mounted) {
        ShadToaster.of(
          context,
        ).show(ShadToast.destructive(description: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isInviting = false);
    }
  }

  // ── Remove / Leave ────────────────────────────────────────────
  void _confirmRemove(BuildContext context, WorkspaceMember member) {
    final isSelf = member.uid == widget.currentUserUid;
    showShadDialog(
      context: context,
      builder: (ctx) => ShadDialog.alert(
        title: Text(isSelf ? 'Leave workspace?' : 'Remove member?'),
        description: Text(
          isSelf
              ? 'You will lose access to this workspace immediately.'
              : '${member.displayName ?? member.email ?? member.uid} will lose access immediately.',
        ),
        actions: [
          ShadButton.outline(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ShadButton.destructive(
            onPressed: _isRemoving ? null : () => _executeRemove(ctx, member),
            child: Text(
              _isRemoving
                  ? 'Removing…'
                  : isSelf
                  ? 'Leave'
                  : 'Remove',
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _executeRemove(
    BuildContext dialogContext,
    WorkspaceMember member,
  ) async {
    final navigator = Navigator.of(dialogContext);
    setState(() => _isRemoving = true);
    try {
      await _teamsService.removeMember(
        appId: widget.appId,
        workspaceId: widget.workspaceId,
        targetUid: member.uid,
      );
      if (mounted) {
        navigator.pop();
        final isSelf = member.uid == widget.currentUserUid;
        ShadToaster.of(context).show(
          ShadToast(
            description: Text(
              isSelf ? 'You left the workspace' : 'Member removed',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ShadToaster.of(
          context,
        ).show(ShadToast.destructive(description: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isRemoving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<WorkspaceMember>>(
      stream: _teamsService.watchMembers(widget.appId, widget.workspaceId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const WorkernSkeletonLoader(
            type: SkeletonType.list,
            itemCount: 4,
          );
        }

        final members = snapshot.data ?? [];
        final isOwner = _isOwner(members);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _TeamsHeader(
              memberCount: members.length,
              isOwner: isOwner,
              onInvite: () => _showInviteSheet(context),
            ),
            const Divider(height: 24),
            if (members.isEmpty)
              _TeamsEmptyState(
                isOwner: isOwner,
                onInvite: () => _showInviteSheet(context),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: members.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final member = members[i];
                  return _MemberTile(
                    member: member,
                    isSelf: member.uid == widget.currentUserUid,
                    canAct: isOwner || member.uid == widget.currentUserUid,
                    onRemove: () => _confirmRemove(context, member),
                  );
                },
              ),
          ],
        );
      },
    );
  }
}
