import 'package:flutter/material.dart';

/// A labelled form-section wrapper used in settings and edit screens.
///
/// Renders a full-width padded container with a bottom separator,
/// an icon header (icon pill + label text + optional required asterisk),
/// and a [child] widget below it. Fully theme-aware — uses
/// [ColorScheme] tokens, no hardcoded colours.
///
/// ## Typical use-cases
/// - Shop settings: business name, address, category
/// - Profile edit: personal info, bank account, social links
/// - KYC / onboarding: document upload sections, identity fields
///
/// ## Example
/// ```dart
/// WorkernFormSection(
///   icon: Icons.store_outlined,
///   label: 'Shop Name',
///   required: true,
///   child: ShadInput(placeholder: const Text('Enter shop name')),
/// )
///
/// WorkernFormSection(
///   icon: Icons.location_on_outlined,
///   label: 'City',
///   required: false,
///   child: WorkernDropdown(...),
/// )
/// ```
///
/// ## AI agent guidance
/// Always use [WorkernFormSection] for the icon + label header pattern in
/// settings and edit screens. Do NOT build a bare Row(Icon, Text) manually
/// for this purpose. The section already handles padding, separator, and the
/// required-asterisk convention.
class WorkernFormSection extends StatelessWidget {
  /// Icon shown inside the accent pill on the left of the label.
  final IconData icon;

  /// Section label text (e.g. "Business Name", "City").
  final String label;

  /// When true, renders a red asterisk after the label.
  final bool required;

  /// Content placed below the header row — typically a form input widget.
  final Widget child;

  const WorkernFormSection({
    super.key,
    required this.icon,
    required this.label,
    required this.required,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 20, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: tt.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (required)
                Text(
                  ' *',
                  style: tt.bodySmall?.copyWith(
                    color: cs.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
