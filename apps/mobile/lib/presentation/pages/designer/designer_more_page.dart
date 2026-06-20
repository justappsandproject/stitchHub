import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerMorePage extends StatelessWidget {
  const DesignerMorePage({super.key});

  void _navigate(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.designerHome);
      case 1:
        context.go(AppRouter.designerOrders);
      case 2:
        context.go(AppRouter.designerMessages);
      case 3:
        context.go(AppRouter.designerCustomers);
      case 4:
        context.go(AppRouter.designerMore);
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.straighten, 'Measurements', AppRouter.designerMeasurements),
      (Icons.palette_outlined, 'Style Store', AppRouter.designerStyles),
      (Icons.cut, 'Production', AppRouter.designerOrders),
      (Icons.inventory_2_outlined, 'Inventory', AppRouter.designerInventory),
      (Icons.payments_outlined, 'Payments', AppRouter.designerBilling),
      (Icons.settings_outlined, 'Settings', AppRouter.settings),
      (Icons.support_agent, 'Support', AppRouter.settings),
    ];

    return DesignerShell(
      title: 'More',
      selectedIndex: 4,
      onNavigate: (i) => _navigate(context, i),
      unreadMessages: 0,
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final (icon, label, route) = items[index];
          return Card(
            color: AppTheme.card,
            child: ListTile(
              leading: Icon(icon, color: AppTheme.navy),
              title: Text(
                label,
                style: const TextStyle(
                  color: AppTheme.navy,
                  fontWeight: FontWeight.w600,
                ),
              ),
              trailing: const Icon(Icons.chevron_right, color: AppTheme.navy),
              onTap: () => context.push(route),
            ),
          );
        },
      ),
    );
  }
}
