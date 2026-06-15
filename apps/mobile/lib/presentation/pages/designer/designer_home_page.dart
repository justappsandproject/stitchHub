import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
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
    final authState = context.watch<AuthBloc>().state;
    final houseName = authState is AuthAuthenticated
        ? authState.user.fashionHouseName ?? 'Your Atelier'
        : 'Your Atelier';
    final firstName =
        authState is AuthAuthenticated ? authState.user.firstName : '';

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
                  houseName: houseName,
                  firstName: firstName,
                  summary: state.summary,
                  onOpenPortfolio: () => context.push(AppRouter.designerPortfolio),
                  onOpenDiscounts: () => context.push(AppRouter.designerDiscounts),
                  onOpenOrders: () => context.go(AppRouter.designerOrders),
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({
    required this.houseName,
    required this.firstName,
    required this.summary,
    required this.onOpenPortfolio,
    required this.onOpenDiscounts,
    required this.onOpenOrders,
  });

  final String houseName;
  final String firstName;
  final DashboardSummary summary;
  final VoidCallback onOpenPortfolio;
  final VoidCallback onOpenDiscounts;
  final VoidCallback onOpenOrders;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _HeroCard(houseName: houseName, firstName: firstName),
        const SizedBox(height: 16),
        buildDashboardGrid(summary),
        const SizedBox(height: 16),
        _QuickActions(
          onPortfolio: onOpenPortfolio,
          onDiscounts: onOpenDiscounts,
          onOrders: onOpenOrders,
          portfolioCount: summary.portfolioCount ?? 0,
          promoCount: summary.activeDiscounts ?? 0,
        ),
        if (summary.ordersByStatus.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            'Production pipeline',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          _PipelineChart(statuses: summary.ordersByStatus),
        ],
        if (summary.recentOrders.isNotEmpty) ...[
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent orders',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              TextButton(onPressed: onOpenOrders, child: const Text('View all')),
            ],
          ),
          const SizedBox(height: 8),
          ...summary.recentOrders.map(
            (order) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primary.withValues(alpha: 0.12),
                  child: const Icon(Icons.shopping_bag_outlined, size: 18),
                ),
                title: Text(order.orderNumber),
                subtitle: Text('${order.customerName} · ${order.fabric ?? 'Custom'}'),
                trailing: orderStatusChip(order.status),
                onTap: onOpenOrders,
              ),
            ),
          ),
        ],
        if (summary.recentPortfolio.isNotEmpty) ...[
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Portfolio highlights',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              TextButton(onPressed: onOpenPortfolio, child: const Text('Manage')),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: summary.recentPortfolio.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = summary.recentPortfolio[index];
                return _PortfolioPreviewCard(item: item);
              },
            ),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.houseName, required this.firstName});

  final String houseName;
  final String firstName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            AppTheme.primary,
            AppTheme.primary.withValues(alpha: 0.75),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back, $firstName',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            houseName,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'Showcase your craft, run promotions, and keep production moving.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.85),
                ),
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onPortfolio,
    required this.onDiscounts,
    required this.onOrders,
    required this.portfolioCount,
    required this.promoCount,
  });

  final VoidCallback onPortfolio;
  final VoidCallback onDiscounts;
  final VoidCallback onOrders;
  final int portfolioCount;
  final int promoCount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ActionTile(
            icon: Icons.photo_library_outlined,
            label: 'Portfolio',
            badge: '$portfolioCount',
            onTap: onPortfolio,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _ActionTile(
            icon: Icons.local_offer_outlined,
            label: 'Promos',
            badge: '$promoCount',
            onTap: onDiscounts,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _ActionTile(
            icon: Icons.timeline,
            label: 'Orders',
            onTap: onOrders,
          ),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Badge(
              isLabelVisible: badge != null,
              label: Text(badge ?? ''),
              child: Icon(icon, color: AppTheme.primary),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _PipelineChart extends StatelessWidget {
  const _PipelineChart({required this.statuses});

  final List<OrderStatusCount> statuses;

  @override
  Widget build(BuildContext context) {
    final maxCount = statuses.map((s) => s.count).fold<int>(0, (a, b) => a > b ? a : b);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: statuses.map((item) {
            final progress = maxCount == 0 ? 0.0 : item.count / maxCount;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(
                      item.status.replaceAll('_', ' '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 8,
                        backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${item.count}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _PortfolioPreviewCard extends StatelessWidget {
  const _PortfolioPreviewCard({required this.item});

  final PortfolioItemEntity item;

  @override
  Widget build(BuildContext context) {
    final imageUrl = item.photoUrls.isNotEmpty ? item.photoUrls.first : null;
    return Container(
      width: 140,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _placeholder(),
                  )
                : _placeholder(),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                ),
                if (item.category != null)
                  Text(
                    item.category!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppTheme.primary.withValues(alpha: 0.08),
      child: const Center(child: Icon(Icons.checkroom_outlined)),
    );
  }
}
