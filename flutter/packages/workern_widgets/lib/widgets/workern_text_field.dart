import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class WorkernTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hint;
  final TextInputType keyboardType;
  final int maxLines;
  final ValueChanged<String>? onChanged;
  final Color primaryColor;
  final bool enabled;
  final bool autofocus;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;
  final TextCapitalization textCapitalization;
  final String? errorText;
  final String? Function(String?)? validator;
  final List<String>? autofillHints;

  const WorkernTextField({
    super.key,
    required this.label,
    required this.controller,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
    this.onChanged,
    this.primaryColor = const Color(0xFF6C5CE7),
    this.enabled = true,
    this.autofocus = false,
    this.inputFormatters,
    this.maxLength,
    this.textCapitalization = TextCapitalization.none,
    this.errorText,
    this.validator,
    this.autofillHints,
  });

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
        ),
      ),
      const SizedBox(height: 4),
      TextFormField(
        controller: controller,
        autofocus: autofocus,
        keyboardType: keyboardType,
        maxLines: maxLines,
        minLines: maxLines == 2 ? 2 : 1,
        onChanged: onChanged,
        enabled: enabled,
        inputFormatters: inputFormatters,
        maxLength: maxLength,
        textCapitalization: textCapitalization,
        validator: validator,
        autofillHints: autofillHints,
        buildCounter: maxLength != null
            ? (
                context, {
                required currentLength,
                required isFocused,
                maxLength,
              }) => Text(
                '$currentLength/$maxLength',
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                ),
              )
            : null,
        style: TextStyle(
          fontSize: 14,
          color: Theme.of(context).colorScheme.onSurface,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            fontSize: 14,
            color: Theme.of(
              context,
            ).colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
          ),
          errorText: errorText,
          filled: true,
          // Use onSurface-based fill so it works in both light and dark themes.
          // surface on dark is near-black, making surface*0.15 invisible.
          fillColor: Theme.of(
            context,
          ).colorScheme.onSurface.withValues(alpha: 0.06),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          isDense: true,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
              color: Theme.of(
                context,
              ).colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
          ),
        ),
      ),
    ],
  );
}
