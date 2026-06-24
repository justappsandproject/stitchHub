import 'package:flutter/material.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';

class PasswordTextField extends StatefulWidget {
  const PasswordTextField({
    super.key,
    this.controller,
    this.labelText = 'Password',
    this.textInputAction,
    this.onFieldSubmitted,
    this.readOnly = false,
    this.initialValue,
  });

  final TextEditingController? controller;
  final String labelText;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onFieldSubmitted;
  final bool readOnly;
  final String? initialValue;

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  late final TextEditingController _controller;
  var _obscure = true;
  var _ownsController = false;

  @override
  void initState() {
    super.initState();
    if (widget.controller != null) {
      _controller = widget.controller!;
    } else {
      _ownsController = true;
      _controller = TextEditingController(text: widget.initialValue);
    }
  }

  @override
  void dispose() {
    if (_ownsController) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      readOnly: widget.readOnly,
      obscureText: _obscure,
      autocorrect: false,
      enableSuggestions: false,
      textInputAction: widget.textInputAction,
      onSubmitted: widget.onFieldSubmitted,
      style: const TextStyle(color: AppTheme.navy, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: _obscure ? 'Tap the eye icon to show' : null,
        suffixIcon: IconButton(
          tooltip: _obscure ? 'Show password' : 'Hide password',
          onPressed: () => setState(() => _obscure = !_obscure),
          icon: Icon(
            _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: AppTheme.navy,
          ),
        ),
      ),
    );
  }
}

/// Read-only password display with show/hide toggle (e.g. generated credentials).
class RevealablePasswordDisplay extends StatefulWidget {
  const RevealablePasswordDisplay({
    super.key,
    required this.password,
    this.labelText = 'Password',
  });

  final String password;
  final String labelText;

  @override
  State<RevealablePasswordDisplay> createState() =>
      _RevealablePasswordDisplayState();
}

class _RevealablePasswordDisplayState extends State<RevealablePasswordDisplay> {
  var _obscure = true;
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.password);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      readOnly: true,
      obscureText: _obscure,
      controller: _controller,
      style: const TextStyle(color: AppTheme.navy, fontWeight: FontWeight.w600),
      decoration: InputDecoration(
        labelText: widget.labelText,
        filled: true,
        fillColor: AppTheme.accentLight.withValues(alpha: 0.35),
        suffixIcon: IconButton(
          tooltip: _obscure ? 'Show password' : 'Hide password',
          onPressed: () => setState(() => _obscure = !_obscure),
          icon: Icon(
            _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: AppTheme.navy,
          ),
        ),
      ),
    );
  }
}
