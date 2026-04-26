import 'package:flutter/material.dart';

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
  });

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: Theme.of(context).textTheme.labelSmall),
      const SizedBox(height: 4),
      TextField(
        controller: controller,
        autofocus: autofocus,
        keyboardType: keyboardType,
        maxLines: maxLines,
        minLines: maxLines == 2 ? 2 : 1,
        onChanged: onChanged,
        enabled: enabled,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(fontSize: 14, color: Colors.grey[400]),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          isDense: true,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
        ),
      ),
    ],
  );
}
