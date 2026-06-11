import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class AdminTenantsPage extends StatefulWidget {
  const AdminTenantsPage({super.key});

  @override
  State<AdminTenantsPage> createState() => _AdminTenantsPageState();
}

class _AdminTenantsPageState extends State<AdminTenantsPage> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    sl<DashboardBloc>().add(const AdminTenantsLoadRequested());
    sl<MessagesBloc>().add(const UnreadCountRequested());
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.adminHome);
      case 1:
        context.go(AppRouter.adminTenants);
      case 2:
        context.go(AppRouter.adminMessages);
      case 3:
        context.go(AppRouter.settings);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MessagesBloc, MessagesState>(
      bloc: sl<MessagesBloc>(),
      listener: (_, state) {
        if (state is UnreadCountUpdated) setState(() => _unread = state.count);
      },
      child: AdminShell(
        title: 'Fashion Houses',
        selectedIndex: 1,
        onNavigate: _navigate,
        unreadMessages: _unread,
        body: BlocBuilder<DashboardBloc, DashboardState>(
          bloc: sl<DashboardBloc>(),
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is AdminTenantsLoaded) {
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: state.tenants.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final tenant = state.tenants[index];
                  return ListTile(
                    tileColor: Colors.white.withValues(alpha: 0.06),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    title: Text(
                      tenant.name,
                      style: const TextStyle(color: Colors.white),
                    ),
                    subtitle: Text(
                      '${tenant.slug} · ${tenant.plan ?? 'No plan'}',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
                    ),
                    trailing: Switch(
                      value: tenant.isActive,
                      onChanged: (_) {},
                    ),
                  );
                },
              );
            }
            if (state is DashboardFailure) {
              return Center(
                child: Text(state.message, style: const TextStyle(color: Colors.white)),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
