import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class WorkernDropDown<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<Widget> options;
  final Widget Function(BuildContext context, T value) selectedOptionBuilder;
  final ValueChanged<T?> onChanged;
  final String hint;

  const WorkernDropDown({
    super.key,
    required this.label,
    required this.options,
    required this.selectedOptionBuilder,
    required this.onChanged,
    this.value,
    this.hint = 'Select an option',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 4),
        SizedBox(
          width: double.infinity,
          child: ShadSelect<T>(
            initialValue: value,
            placeholder: Text(hint),
            options: options,
            selectedOptionBuilder: selectedOptionBuilder,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}
