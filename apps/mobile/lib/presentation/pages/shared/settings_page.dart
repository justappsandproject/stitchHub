import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/notifications/push_notification_service.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AuthBloc>().state;
    final user = state is AuthAuthenticated ? state.user : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user != null) ...[
            ListTile(
              leading: CircleAvatar(child: Text(user.firstName[0])),
              title: Text(user.fullName),
              subtitle: Text('${roleLabel(user.role)}\n${user.email}'),
            ),
            const Divider(),
          ],
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Push notifications'),
            subtitle: Text(
              sl<PushNotificationService>().cachedToken != null
                  ? 'Device registered'
                  : 'Configure Firebase to enable',
            ),
          ),
          ListTile(
            leading: const Icon(Icons.sync),
            title: const Text('Offline sync'),
            subtitle: const Text('Changes queue automatically when offline'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign out'),
            onTap: () {
              context.read<AuthBloc>().add(const AuthLogoutRequested());
              context.go(AppRouter.login);
            },
          ),
        ],
      ),
    );
  }
}
