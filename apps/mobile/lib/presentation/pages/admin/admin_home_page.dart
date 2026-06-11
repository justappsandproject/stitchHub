import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class AdminHomePage extends StatefulWidget {
  const AdminHomePage({super.key});

  @override
  State<AdminHomePage> createState() => _AdminHomePageState();
}

class _AdminHomePageState extends State<AdminHomePage> {
  int _tab = 0;
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    sl<DashboardBloc>().add(const DashboardLoadRequested(isAdmin: true));
    sl<MessagesBloc>().add(const UnreadCountRequested());
  }

  void _navigate(int index) {
    setState(() => _tab = index);
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
    return MultiBlocListener(
      listeners: [
        BlocListener<MessagesBloc, MessagesState>(
          bloc: sl<MessagesBloc>(),
          listener: (_, state) {
            if (state is UnreadCountUpdated) setState(() => _unread = state.count);
          },
        ),
      ],
      child: AdminShell(
        title: 'Platform Overview',
        selectedIndex: _tab,
        onNavigate: _navigate,
        unreadMessages: _unread,
        body: BlocBuilder<DashboardBloc, DashboardState>(
          bloc: sl<DashboardBloc>(),
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is DashboardFailure) {
              return Center(child: Text(state.message));
            }
            if (state is DashboardLoaded) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    state.summary.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  buildDashboardGrid(state.summary),
                ],
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
