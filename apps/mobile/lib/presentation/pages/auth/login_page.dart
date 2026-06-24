import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/password_text_field.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                const SizedBox(height: 48),
                const Icon(Icons.cut, size: 72, color: Color(0xFF7C3AED)),
                const SizedBox(height: 16),
                Text(
                  'Welcome to StitchHub',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in as a customer, fashion designer, or platform admin.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.text,
                  decoration: const InputDecoration(labelText: 'Email or username'),
                ),
                const SizedBox(height: 16),
                PasswordTextField(
                  controller: _passwordController,
                  labelText: 'Password',
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: loading
                      ? null
                      : () {
                          context.read<AuthBloc>().add(
                                AuthLoginRequested(
                                  email: _emailController.text.trim(),
                                  password: _passwordController.text,
                                ),
                              );
                        },
                  child: Text(loading ? 'Signing in...' : 'Sign in'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: loading
                      ? null
                      : () => context.push('/register/customer'),
                  child: const Text('Join as a customer'),
                ),
                TextButton(
                  onPressed: loading ? null : () => context.push('/forgot-password'),
                  child: const Text('Forgot password?'),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Demo accounts:\n'
                  'Admin: admin@stitchhub.com / admin123\n'
                  'Designer: owner@elegantstitches.com / demo1234\n'
                  'Customer: chidi@example.com / customer1234',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
