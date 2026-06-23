import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/subscription/plan_gate.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
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
  bool _showWelcome = false;

  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addPostFrameCallback((_) {
      sl<DashboardBloc>().add(const DashboardLoadRequested());
      sl<MessagesBloc>().add(const UnreadCountRequested());
      _maybeShowWelcome();
    });
  }

  Future<void> _maybeShowWelcome() async {
    final prefs = sl<SharedPreferences>();
    if (prefs.getBool('welcome_free_shown') == true) return;
    final sub = await loadCurrentSubscription();
    if (!mounted) return;
    if (sub?.plan == SubscriptionPlan.free) {
      setState(() => _showWelcome = true);
      await prefs.setBool('welcome_free_shown', true);
    }
  }

  void _navigate(int index) => navigateDesignerShell(context, index);

  @override
  Widget build(BuildContext context) {
    return BlocListener<MessagesBloc, MessagesState>(
      bloc: sl<MessagesBloc>(),
      listener: (_, state) {
        if (state is UnreadCountUpdated) setState(() => _unread = state.count);
      },
      child: DesignerShell(
        title: 'Dashboard',
        selectedIndex: 0,
        onNavigate: _navigate,
        unreadMessages: _unread,
        body: BlocBuilder<DashboardBloc, DashboardState>(
          bloc: sl<DashboardBloc>(),
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is DashboardFailure) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(state.message),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () =>
                          sl<DashboardBloc>().add(const DashboardLoadRequested()),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }
            if (state is DashboardLoaded) {
              return RefreshIndicator(
                onRefresh: () async {
                  sl<DashboardBloc>().add(const DashboardLoadRequested());
                  sl<MessagesBloc>().add(const UnreadCountRequested());
                  await Future<void>.delayed(const Duration(milliseconds: 400));
                },
                child: _DashboardBody(
                  summary: state.summary,
                  showWelcome: _showWelcome,
                  onDismissWelcome: () => setState(() => _showWelcome = false),
                ),
              );
            }
            return const Center(child: CircularProgressIndicator());
          },
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({
    required this.summary,
    this.showWelcome = false,
    this.onDismissWelcome,
  });

  final DashboardSummary summary;
  final bool showWelcome;
  final VoidCallback? onDismissWelcome;

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final name = authState is AuthAuthenticated ? authState.user.firstName : 'there';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (showWelcome)
          Card(
            color: AppTheme.accentLight,
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome to StitchHub',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.navy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "You're on the Free plan — up to 5 customers and 10 orders per month. Upgrade anytime.",
                    style: TextStyle(color: AppTheme.navy, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: () => context.push(AppRouter.planDetail),
                        child: const Text('Upgrade'),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: onDismissWelcome,
                        child: const Text('Get Started'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        Text(
          'Good morning, $name',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        Text(
          DateTime.now().toString().split(' ').first,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 20),
        buildDashboardGrid(
          summary,
          onStatTap: (label) => navigateDashboardStat(context, label),
        ),
        const SizedBox(height: 20),
        Text('Quick actions', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        SizedBox(
          height: 96,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _QuickAction(
                icon: Icons.add,
                label: 'New order',
                onTap: () => context.push(AppRouter.designerCreateOrder),
              ),
              _QuickAction(
                icon: Icons.person_add_outlined,
                label: 'New client',
                onTap: () => context.go(AppRouter.designerCustomers),
              ),
              _QuickAction(
                icon: Icons.storefront_outlined,
                label: 'Style Store',
                onTap: () => context.go(AppRouter.designerStyles),
              ),
              _QuickAction(
                icon: Icons.inventory_2_outlined,
                label: 'Inventory',
                onTap: () => context.push(AppRouter.designerInventory),
              ),
              _QuickAction(
                icon: Icons.payments_outlined,
                label: 'Billing',
                onTap: () => context.go(AppRouter.designerBilling),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => context.go(AppRouter.designerStyles),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.storefront_outlined, color: AppTheme.primary),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Style Store',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        Text(
                          'Manage lookbook & design collections',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
            ),
          ),
        ),
        if (summary.ordersByStatus.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Orders by Status',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Tap a stage to view orders',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: summary.ordersByStatus.map((item) {
                  return Material(
                    color: Theme.of(context).colorScheme.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: () => context.go(AppRouter.designerOrders),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: (MediaQuery.of(context).size.width - 72) / 2,
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                item.status.replaceAll('_', ' '),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            Text(
                              '${item.count}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: AppTheme.accent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
        if (summary.recentOrders.isNotEmpty) ...[
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Recent Orders',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'Latest order activity',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
              TextButton(
                onPressed: () => context.go(AppRouter.designerOrders),
                child: const Text('View all'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...summary.recentOrders.map(
            (order) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => context.go(AppRouter.designerOrders),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.orderNumber,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              order.customerName,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          orderStatusChip(order.status),
                          const SizedBox(height: 4),
                          Text(
                            formatNgn(order.totalAmount),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Material(
        color: AppTheme.accentLight,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          child: SizedBox(
            width: 88,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: AppTheme.navy),
                const SizedBox(height: 6),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.navy),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
