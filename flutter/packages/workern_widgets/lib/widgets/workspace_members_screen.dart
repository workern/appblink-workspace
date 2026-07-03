import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import '../helpers/feedback/workern_snackbar.dart';
import 'workern_skeleton_loader.dart';

class MemberRoleOption {
  final String value;
  final String label;

  const MemberRoleOption({required this.value, required this.label});
}

class WorkspaceMembersScreen<T> extends StatefulWidget {
  final String currentUserUid;
  final List<T> members;
  final List<MemberRoleOption> availableRoles;
  final String ownerRoleValue;
  final bool isLoading;
  final bool isInviting;
  final bool isRemoving;
  final bool showInviteComingSoon;

  // Callbacks
  final Future<void> Function(String email, String role) onInvite;
  final Future<void> Function(T member, String newRole) onUpdateRole;
  final Future<void> Function(T member) onRemove;

  // Getters
  final String Function(T member) getId;
  final String Function(T member) getUid;
  final String Function(T member) getName;
  final String Function(T member) getEmail;
  final String Function(T member) getPhotoUrl;
  final String Function(T member) getRoleValue;

  const WorkspaceMembersScreen({
    super.key,
    required this.currentUserUid,
    required this.members,
    required this.availableRoles,
    required this.onInvite,
    required this.onUpdateRole,
    required this.onRemove,
    required this.getId,
    required this.getUid,
    required this.getName,
    required this.getEmail,
    required this.getPhotoUrl,
    required this.getRoleValue,
    this.ownerRoleValue = 'OWNER',
    this.isLoading = false,
    this.isInviting = false,
    this.isRemoving = false,
    this.showInviteComingSoon = false,
  });

  @override
  State<WorkspaceMembersScreen<T>> createState() =>
      _WorkspaceMembersScreenState<T>();
}

class _WorkspaceMembersScreenState<T> extends State<WorkspaceMembersScreen<T>> {
  final _inviteEmailController = TextEditingController();
  late String _inviteRole;

  @override
  void initState() {
    super.initState();
    _inviteRole = widget.availableRoles.isNotEmpty
        ? widget.availableRoles.last.value
        : '';
  }

  @override
  void dispose() {
    _inviteEmailController.dispose();
    super.dispose();
  }

  bool _isOwner(List<T> members) => members.any((m) =>
      widget.getUid(m) == widget.currentUserUid &&
      widget.getRoleValue(m) == widget.ownerRoleValue);

  String _getInitials(T member) {
    final name = widget.getName(member);
    final email = widget.getEmail(member);
    final id = widget.getId(member);
    final text = name.isNotEmpty ? name : (email.isNotEmpty ? email : id);
    if (text.isEmpty) return '?';
    return text.substring(0, text.length >= 2 ? 2 : 1).toUpperCase();
  }

  String _getRoleLabel(String value) {
    final option = widget.availableRoles.firstWhere(
      (r) => r.value == value,
      orElse: () => MemberRoleOption(value: value, label: value),
    );
    return option.label;
  }

  void _showInviteSheet(BuildContext context) {
    _inviteEmailController.clear();
    if (widget.availableRoles.isNotEmpty) {
      _inviteRole = widget.availableRoles.last.value;
    }
    showShadSheet(
      side: ShadSheetSide.right,
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => ShadSheet(
          title: const Text('Invite a member'),
          description: const Text(
            'Enter the email address of the person you\'d like to invite.',
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Email address', style: TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                ShadInput(
                  controller: _inviteEmailController,
                  placeholder: const Text('colleague@example.com'),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                const Text('Role', style: TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                if (widget.availableRoles.isNotEmpty)
                  ShadSelect<String>(
                    initialValue: _inviteRole,
                    onChanged: (val) {
                      if (val != null) setSheetState(() => _inviteRole = val);
                    },
                    options: widget.availableRoles
                        .map((r) => ShadOption(value: r.value, child: Text(r.label)))
                        .toList(),
                    selectedOptionBuilder: (context, value) =>
                        Text(_getRoleLabel(value)),
                  ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    ShadButton.outline(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ShadButton(
                      onPressed: widget.isInviting
                          ? null
                          : () async {
                              final email = _inviteEmailController.text.trim();
                              if (email.isEmpty) return;
                              await widget.onInvite(email, _inviteRole);
                              if (ctx.mounted) Navigator.of(ctx).pop();
                            },
                      child: Text(widget.isInviting ? 'Sending...' : 'Send invite'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmRemove(BuildContext context, T member) {
    final isSelf = widget.getUid(member) == widget.currentUserUid;
    final name = widget.getName(member);
    final email = widget.getEmail(member);
    final id = widget.getId(member);
    final displayName = name.isNotEmpty ? name : (email.isNotEmpty ? email : id);

    showShadDialog(
      context: context,
      builder: (ctx) => ShadDialog.alert(
        title: Text(isSelf ? 'Leave workspace?' : 'Remove member?'),
        description: Text(
          isSelf
              ? 'You will lose access to this workspace immediately.'
              : '$displayName will lose access immediately.',
        ),
        actions: [
          ShadButton.outline(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ShadButton.destructive(
            onPressed: widget.isRemoving
                ? null
                : () async {
                    await widget.onRemove(member);
                    if (ctx.mounted) Navigator.of(ctx).pop();
                  },
            child: Text(
              widget.isRemoving
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

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return const WorkernSkeletonLoader(
        type: SkeletonType.list,
        itemCount: 4,
      );
    }
 
    final isCurrentUserOwner = _isOwner(widget.members);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
 
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  const Icon(Icons.group_outlined, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Team Members',
                          style: tt.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${widget.members.length} member${widget.members.length == 1 ? '' : 's'}',
                          style: tt.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (isCurrentUserOwner) ...[
              const SizedBox(width: 12),
              ShadButton(
                size: ShadButtonSize.sm,
                onPressed: widget.showInviteComingSoon
                    ? () => WorkernSnackbar.show(context, 'This feature is coming soon.')
                    : () => _showInviteSheet(context),
                child: const Row(
                  children: [
                    Icon(Icons.person_add_alt, size: 16),
                    SizedBox(width: 8),
                    Text('Invite'),
                  ],
                ),
              ),
            ],
          ],
        ),
        const Divider(height: 32),
        if (widget.members.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.group_outlined,
                    size: 48,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No members yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Invite colleagues to collaborate in this workspace.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  if (isCurrentUserOwner) ...[
                    const SizedBox(height: 24),
                    ShadButton.outline(
                      onPressed: widget.showInviteComingSoon
                          ? () => WorkernSnackbar.show(context, 'This feature is coming soon.')
                          : () => _showInviteSheet(context),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.person_add_alt, size: 16),
                          SizedBox(width: 8),
                          Text('Invite first member'),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.members.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final member = widget.members[i];
              final uid = widget.getUid(member);
              final isSelf = uid == widget.currentUserUid;
              final roleValue = widget.getRoleValue(member);
              final isOwner = roleValue == widget.ownerRoleValue;
              final canAct = isCurrentUserOwner || isSelf;
              final photoUrl = widget.getPhotoUrl(member);

              final radius = BorderRadius.circular(16);
              return ClipRRect(
                borderRadius: radius,
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? cs.surface.withValues(alpha: 0.6)
                          : cs.surface.withValues(alpha: 0.8),
                      borderRadius: radius,
                      border: Border.all(
                        color: cs.outlineVariant.withValues(alpha: 0.4),
                      ),
                      boxShadow: Theme.of(context).brightness == Brightness.light
                          ? [
                              BoxShadow(
                                color: cs.shadow.withValues(alpha: 0.04),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      children: [
                        ShadAvatar(
                          photoUrl.isNotEmpty ? photoUrl : 'https://i.pravatar.cc/150?u=$uid',
                          placeholder: Text(_getInitials(member)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      widget.getName(member).isNotEmpty
                                          ? widget.getName(member)
                                          : (widget.getEmail(member).isNotEmpty
                                              ? widget.getEmail(member)
                                              : widget.getId(member)),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w500,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      maxLines: 1,
                                    ),
                                  ),
                                  if (isSelf) ...[
                                    const SizedBox(width: 6),
                                    Text(
                                      '(you)',
                                      style: TextStyle(
                                        color: cs.onSurfaceVariant,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              if (widget.getEmail(member).isNotEmpty &&
                                  widget.getName(member).isNotEmpty)
                                Text(
                                  widget.getEmail(member),
                                  style: TextStyle(
                                    color: cs.onSurfaceVariant,
                                    fontSize: 13,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  maxLines: 1,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        if (isOwner)
                          ShadBadge(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star, size: 12),
                                const SizedBox(width: 4),
                                Text(_getRoleLabel(roleValue)),
                              ],
                            ),
                          )
                        else if (isCurrentUserOwner && !isSelf && widget.availableRoles.isNotEmpty)
                          ShadSelect<String>(
                            initialValue: roleValue,
                            onChanged: (newRole) {
                              if (newRole != null && newRole != roleValue) {
                                widget.onUpdateRole(member, newRole);
                              }
                            },
                            options: widget.availableRoles
                                .map((r) => ShadOption(value: r.value, child: Text(r.label)))
                                .toList(),
                            selectedOptionBuilder: (context, value) =>
                                Text(_getRoleLabel(value)),
                          )
                        else
                          ShadBadge.secondary(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.person, size: 12),
                                const SizedBox(width: 4),
                                Text(_getRoleLabel(roleValue)),
                              ],
                            ),
                          ),
                        if (canAct && !isOwner) ...[
                          const SizedBox(width: 8),
                          ShadButton.ghost(
                            onPressed: () => _confirmRemove(context, member),
                            child: const Icon(Icons.person_remove),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}
