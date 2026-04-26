part of 'workspace_teams_screen.dart';

// ── Header ────────────────────────────────────────────────────────────────────

class _TeamsHeader extends StatelessWidget {
  final int memberCount;
  final bool isOwner;
  final VoidCallback onInvite;

  const _TeamsHeader({
    required this.memberCount,
    required this.isOwner,
    required this.onInvite,
  });

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Row(
      children: [
        const Icon(Icons.group_outlined, size: 20, color: Colors.grey),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Team Members',
                style: theme.textTheme.h4.copyWith(fontSize: 16),
              ),
              Text(
                '$memberCount member${memberCount == 1 ? '' : 's'}',
                style: theme.textTheme.muted.copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
        if (isOwner)
          ShadButton(
            size: ShadButtonSize.sm,
            onPressed: onInvite,
            leading: const Padding(
              padding: EdgeInsets.only(right: 6),
              child: Icon(Icons.person_add_outlined, size: 16),
            ),
            child: const Text('Invite'),
          ),
      ],
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _TeamsEmptyState extends StatelessWidget {
  final bool isOwner;
  final VoidCallback onInvite;

  const _TeamsEmptyState({required this.isOwner, required this.onInvite});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.group_outlined,
              size: 48,
              color: theme.colorScheme.mutedForeground.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text('No members yet', style: theme.textTheme.h4),
            const SizedBox(height: 8),
            Text(
              'Invite colleagues to collaborate in this workspace.',
              style: theme.textTheme.muted,
              textAlign: TextAlign.center,
            ),
            if (isOwner) ...[
              const SizedBox(height: 20),
              ShadButton(
                size: ShadButtonSize.sm,
                onPressed: onInvite,
                leading: const Padding(
                  padding: EdgeInsets.only(right: 6),
                  child: Icon(Icons.person_add_outlined, size: 16),
                ),
                child: const Text('Invite first member'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Member tile ───────────────────────────────────────────────────────────────

class _MemberTile extends StatefulWidget {
  final WorkspaceMember member;
  final bool isSelf;
  final bool canAct;
  final VoidCallback onRemove;

  const _MemberTile({
    required this.member,
    required this.isSelf,
    required this.canAct,
    required this.onRemove,
  });

  @override
  State<_MemberTile> createState() => _MemberTileState();
}

class _MemberTileState extends State<_MemberTile> {
  bool _pressed = false;

  String get _initials {
    final name =
        widget.member.displayName ?? widget.member.email ?? widget.member.uid;
    return name.substring(0, name.length.clamp(0, 2)).toUpperCase();
  }

  bool get _isOwner => widget.member.role == WorkspaceMemberRole.owner;

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.99 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: ShadCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundImage: widget.member.photoUrl != null
                    ? NetworkImage(widget.member.photoUrl!)
                    : null,
                backgroundColor: theme.colorScheme.muted,
                child: widget.member.photoUrl == null
                    ? Text(
                        _initials,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.mutedForeground,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              // Name + email
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            widget.member.displayName ??
                                widget.member.email ??
                                widget.member.uid,
                            style: theme.textTheme.p.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (widget.isSelf) ...[
                          const SizedBox(width: 4),
                          Text(
                            ' (you)',
                            style: theme.textTheme.muted.copyWith(fontSize: 12),
                          ),
                        ],
                      ],
                    ),
                    if (widget.member.displayName != null &&
                        widget.member.email != null)
                      Text(
                        widget.member.email!,
                        style: theme.textTheme.muted.copyWith(fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Role badge
              ShadBadge(
                backgroundColor: _isOwner
                    ? theme.colorScheme.primary
                    : theme.colorScheme.secondary,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isOwner
                          ? Icons.workspace_premium_outlined
                          : Icons.person_outline,
                      size: 11,
                      color: _isOwner
                          ? theme.colorScheme.primaryForeground
                          : theme.colorScheme.secondaryForeground,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      _isOwner ? 'Owner' : 'Member',
                      style: TextStyle(
                        fontSize: 11,
                        color: _isOwner
                            ? theme.colorScheme.primaryForeground
                            : theme.colorScheme.secondaryForeground,
                      ),
                    ),
                  ],
                ),
              ),
              // Remove / Leave action
              if (widget.canAct && !_isOwner) ...[
                const SizedBox(width: 4),
                Semantics(
                  label: widget.isSelf ? 'Leave workspace' : 'Remove member',
                  button: true,
                  child: ShadButton.ghost(
                    size: ShadButtonSize.sm,
                    onPressed: widget.onRemove,
                    child: Icon(
                      Icons.person_remove_outlined,
                      size: 16,
                      color: theme.colorScheme.destructive,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Invite sheet ──────────────────────────────────────────────────────────────

class _InviteSheet extends StatefulWidget {
  final TextEditingController emailController;
  final WorkspaceMemberRole initialRole;
  final bool isInviting;
  final ValueChanged<WorkspaceMemberRole> onRoleChanged;
  final VoidCallback onSubmit;

  const _InviteSheet({
    required this.emailController,
    required this.initialRole,
    required this.isInviting,
    required this.onRoleChanged,
    required this.onSubmit,
  });

  @override
  State<_InviteSheet> createState() => _InviteSheetState();
}

class _InviteSheetState extends State<_InviteSheet> {
  late WorkspaceMemberRole _role;

  @override
  void initState() {
    super.initState();
    _role = widget.initialRole;
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ShadSheet(
      title: const Text('Invite a member'),
      description: const Text(
        "Enter the email address of the person you'd like to invite.",
      ),
      actions: [
        ShadButton.outline(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ShadButton(
          onPressed: widget.isInviting ? null : widget.onSubmit,
          child: Text(widget.isInviting ? 'Sending\u2026' : 'Send invite'),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Email address', style: theme.textTheme.small),
            const SizedBox(height: 6),
            ShadInput(
              controller: widget.emailController,
              keyboardType: TextInputType.emailAddress,
              placeholder: const Text('colleague@example.com'),
            ),
            const SizedBox(height: 16),
            Text('Role', style: theme.textTheme.small),
            const SizedBox(height: 6),
            ShadSelect<WorkspaceMemberRole>(
              initialValue: _role,
              onChanged: (val) {
                if (val == null) return;
                setState(() => _role = val);
                widget.onRoleChanged(val);
              },
              options: [
                const ShadOption(
                  value: WorkspaceMemberRole.member,
                  child: Text('Member'),
                ),
                const ShadOption(
                  value: WorkspaceMemberRole.owner,
                  child: Text('Owner'),
                ),
              ],
              selectedOptionBuilder: (ctx, val) =>
                  Text(val == WorkspaceMemberRole.owner ? 'Owner' : 'Member'),
            ),
          ],
        ),
      ),
    );
  }
}
