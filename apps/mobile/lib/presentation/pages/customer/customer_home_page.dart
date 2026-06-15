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
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({super.key});

  @override
  State<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends State<CustomerHomePage> {
  @override
  void initState() {
    super.initState();
    sl<DashboardBloc>().add(const DashboardLoadRequested());
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.customerHome);
      case 1:
        context.go(AppRouter.customerOrders);
      case 2:
        context.go(AppRouter.customerMeasurements);
      case 3:
        context.go(AppRouter.settings);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final name = authState is AuthAuthenticated ? authState.user.firstName : 'there';
    final houseName = authState is AuthAuthenticated
        ? authState.user.fashionHouseName ?? 'your fashion house'
        : 'your fashion house';

    return CustomerShell(
      title: 'Hello, $name',
      selectedIndex: 0,
      onNavigate: _navigate,
      body: BlocBuilder<DashboardBloc, DashboardState>(
        bloc: sl<DashboardBloc>(),
        builder: (context, state) {
          final portfolio = state is DashboardLoaded ? state.summary.recentPortfolio : <PortfolioItemEntity>[];

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome to $houseName',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Track your orders, browse the atelier portfolio, and manage your measurements.',
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => context.go(AppRouter.customerOrders),
                        child: const Text('View my orders'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: () => context.push(AppRouter.customerPortfolio),
                        child: const Text('Browse fashion house portfolio'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: () => context.go(AppRouter.customerMeasurements),
                        child: const Text('View my measurements'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (state is DashboardLoading)
                const Center(child: CircularProgressIndicator())
              else if (state is DashboardLoaded) ...[
                buildDashboardGrid(state.summary),
                if (portfolio.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Latest from the atelier',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      TextButton(
                        onPressed: () => context.push(AppRouter.customerPortfolio),
                        child: const Text('See all'),
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 150,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: portfolio.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = portfolio[index];
                        return _CustomerPortfolioPreview(item: item);
                      },
                    ),
                  ),
                ],
              ],
            ],
          );
        },
      ),
    );
  }
}

class _CustomerPortfolioPreview extends StatelessWidget {
  const _CustomerPortfolioPreview({required this.item});

  final PortfolioItemEntity item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: item.photoUrls.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: item.photoUrls.first,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  )
                : Container(
                    color: AppTheme.primary.withValues(alpha: 0.08),
                    child: const Center(child: Icon(Icons.checkroom_outlined)),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
