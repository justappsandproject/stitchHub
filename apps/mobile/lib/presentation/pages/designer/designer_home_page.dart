import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerHomePage extends StatefulWidget {
  const DesignerHomePage({super.key});

  @override
  State<DesignerHomePage> createState() => _DesignerHomePageState();
}

class _DesignerHomePageState extends State<DesignerHomePage> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    sl<DashboardBloc>().add(const DashboardLoadRequested());
    sl<MessagesBloc>().add(const UnreadCountRequested());
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.designerHome);
      case 1:
        context.go(AppRouter.designerOrders);
      case 2:
        context.go(AppRouter.designerCustomers);
      case 3:
        context.go(AppRouter.designerMessages);
      case 4:
        context.go(AppRouter.designerBilling);
      case 5:
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
      child: DesignerShell(
        title: 'Atelier Dashboard',
        selectedIndex: 0,
        onNavigate: _navigate,
        unreadMessages: _unread,
        body: BlocBuilder<DashboardBloc, DashboardState>(
          bloc: sl<DashboardBloc>(),
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is DashboardLoaded) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    state.summary.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  buildDashboardGrid(state.summary),
                ],
              );
            }
            if (state is DashboardFailure) {
              return Center(child: Text(state.message));
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
