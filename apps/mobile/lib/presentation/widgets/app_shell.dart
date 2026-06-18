import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/presentation/widgets/offline_banner.dart';
import 'package:stitchhub_mobile/presentation/widgets/stat_card.dart';

class DesignerShell extends StatelessWidget {
  const DesignerShell({
    super.key,
    required this.title,
    required this.body,
    required this.selectedIndex,
    required this.onNavigate,
    required this.unreadMessages,
    this.actions,
  });

  final String title;
  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onNavigate;
  final int unreadMessages;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...?actions,
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => onNavigate(5),
          ),
        ],
      ),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: body),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: onNavigate,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.shopping_bag_outlined),
            selectedIcon: Icon(Icons.shopping_bag),
            label: 'Orders',
          ),
          const NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Clients',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unreadMessages > 0,
              label: Text('$unreadMessages'),
              child: const Icon(Icons.chat_bubble_outline),
            ),
            selectedIcon: const Icon(Icons.chat_bubble),
            label: 'Messages',
          ),
          const NavigationDestination(
            icon: Icon(Icons.payments_outlined),
            selectedIcon: Icon(Icons.payments),
            label: 'Billing',
          ),
        ],
      ),
    );
  }
}

class AdminShell extends StatelessWidget {
  const AdminShell({
    super.key,
    required this.title,
    required this.body,
    required this.selectedIndex,
    required this.onNavigate,
    required this.unreadMessages,
  });

  final String title;
  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onNavigate;
  final int unreadMessages;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceDark,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceDark,
        foregroundColor: Colors.white,
        title: Text(title),
      ),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: body),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: onNavigate,
        destinations: [
          const NavigationDestination(icon: Icon(Icons.analytics_outlined), label: 'Overview'),
          const NavigationDestination(icon: Icon(Icons.store_outlined), label: 'Houses'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unreadMessages > 0,
              label: Text('$unreadMessages'),
              child: const Icon(Icons.forum_outlined),
            ),
            label: 'Messages',
          ),
          const NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}

class CustomerShell extends StatelessWidget {
  const CustomerShell({
    super.key,
    required this.title,
    required this.body,
    required this.selectedIndex,
    required this.onNavigate,
  });

  final String title;
  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onNavigate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: body),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: onNavigate,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.palette_outlined), label: 'Lookbook'),
          NavigationDestination(icon: Icon(Icons.checkroom_outlined), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.straighten), label: 'Measure'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}

Widget buildDashboardGrid(
  DashboardSummary summary, {
  void Function(String label)? onStatTap,
}) {
  IconData? iconFor(String label) => switch (label) {
        'Customers' => Icons.people_outline,
        'Total Orders' || 'Active Orders' || 'Delivered' => Icons.shopping_bag_outlined,
        'Revenue' || 'Outstanding' => Icons.payments_outlined,
        _ => Icons.insights_outlined,
      };

  return GridView.builder(
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.35,
    ),
    itemCount: summary.stats.length,
    itemBuilder: (context, index) {
      final stat = summary.stats[index];
      return StatCard(
        label: stat.label,
        value: stat.isCurrency ? formatNgn(stat.value) : '${stat.value}',
        icon: iconFor(stat.label),
        onTap: onStatTap != null ? () => onStatTap(stat.label) : null,
      );
    },
  );
}

void navigateDashboardStat(BuildContext context, String label) {
  switch (label) {
    case 'Customers':
      context.go('/designer/customers');
    case 'Total Orders':
    case 'Active Orders':
    case 'Delivered':
      context.go('/designer/orders');
    case 'Revenue':
    case 'Outstanding':
      context.go('/designer/billing');
    default:
      break;
  }
}

Widget orderStatusChip(OrderStatus status) {
  final color = switch (status) {
    OrderStatus.delivered => Colors.green,
    OrderStatus.cancelled => Colors.red,
    OrderStatus.ready => Colors.teal,
    _ => AppTheme.accent,
  };

  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      status.value.replaceAll('_', ' '),
      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
    ),
  );
}
