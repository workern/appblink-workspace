import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

/// A text field with a non-editable currency symbol prefix, built on ShadInput.
class PrefixTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String currencySymbol;
  final String? hintText;
  final String? labelText;
  final ValueChanged<String>? onChanged;
  final bool enabled;
  final Color primaryColor;
  final TextInputType keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;

  const PrefixTextField({
    super.key,
    this.controller,
    required this.currencySymbol,
    this.hintText,
    this.labelText,
    this.onChanged,
    this.enabled = true,
    this.primaryColor = const Color(0xFF6C5CE7),
    this.keyboardType = const TextInputType.numberWithOptions(decimal: true),
    this.inputFormatters,
    this.maxLength,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (labelText != null) ...[
          Text(labelText!, style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 4),
        ],
        ShadInput(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          onChanged: onChanged,
          inputFormatters: inputFormatters,
          maxLength: maxLength,
          maxLengthEnforcement: maxLength != null
              ? MaxLengthEnforcement.enforced
              : null,
          placeholder: hintText != null ? Text(hintText!) : null,
          leading: Text(
            currencySymbol,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: enabled ? Colors.grey[700] : Colors.grey[400],
            ),
          ),
        ),
      ],
    );
  }
}
