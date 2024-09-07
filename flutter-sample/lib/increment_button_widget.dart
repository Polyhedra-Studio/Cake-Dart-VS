import 'package:flutter/material.dart';

class IncrementButtonWidget extends StatelessWidget {
  final void Function() onPressed;
  const IncrementButtonWidget({required this.onPressed, super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: onPressed,
      tooltip: 'Increment',
      child: const Icon(Icons.add),
    );
  }
}
