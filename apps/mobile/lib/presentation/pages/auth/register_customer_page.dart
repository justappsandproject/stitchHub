import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/password_text_field.dart';

class RegisterCustomerPage extends StatefulWidget {
  const RegisterCustomerPage({super.key});

  @override
  State<RegisterCustomerPage> createState() => _RegisterCustomerPageState();
}

class _RegisterCustomerPageState extends State<RegisterCustomerPage> {
  final _tenantSlugController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _tenantSlugController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Join your fashion house')),
      body: SafeArea(
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthFailure) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.message)),
              );
            }
          },
          builder: (context, state) {
            final loading = state is AuthLoading;

            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Text(
                  'Create a customer account to track orders and measurements from your designer.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _tenantSlugController,
                  decoration: const InputDecoration(
                    labelText: 'Fashion house code',
                    hintText: 'elegant-stitches',
                    helperText: 'Ask your designer for their StitchHub code',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _firstNameController,
                  decoration: const InputDecoration(labelText: 'First name'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _lastNameController,
                  decoration: const InputDecoration(labelText: 'Last name'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone',
                    hintText: '+2348012345678',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                const SizedBox(height: 16),
                PasswordTextField(controller: _passwordController),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: loading
                      ? null
                      : () {
                          context.read<AuthBloc>().add(
                                AuthRegisterRequested(
                                  tenantSlug:
                                      _tenantSlugController.text.trim(),
                                  email: _emailController.text.trim(),
                                  password: _passwordController.text,
                                  firstName:
                                      _firstNameController.text.trim(),
                                  lastName: _lastNameController.text.trim(),
                                  phone: _phoneController.text.trim(),
                                ),
                              );
                        },
                  child: Text(loading ? 'Creating account...' : 'Create account'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.go(AppRouter.login),
                  child: const Text('Already have an account? Sign in'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
