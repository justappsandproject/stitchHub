import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/subscription/plan_gate.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerMorePage extends StatefulWidget {
  const DesignerMorePage({super.key});

  @override
  State<DesignerMorePage> createState() => _DesignerMorePageState();
}

class _DesignerMorePageState extends State<DesignerMorePage> {
  @override
  Widget build(BuildContext context) {
    final items = <({IconData icon, String label, String route, GatedFeature? gate})>[
      (icon: Icons.straighten, label: 'Measurements', route: AppRouter.designerMeasurements, gate: null),
      (icon: Icons.palette_outlined, label: 'Style Store', route: AppRouter.designerStyles, gate: GatedFeature.styleStore),
      (icon: Icons.cut, label: 'Production', route: AppRouter.designerOrders, gate: null),
      (icon: Icons.inventory_2_outlined, label: 'Inventory', route: AppRouter.designerInventory, gate: null),
      (icon: Icons.payments_outlined, label: 'Payments', route: AppRouter.designerBilling, gate: null),
      (icon: Icons.settings_outlined, label: 'Settings', route: AppRouter.settings, gate: null),
      (icon: Icons.support_agent, label: 'Support', route: AppRouter.support, gate: null),
    ];

    return DesignerShell(
      title: 'More',
      selectedIndex: 4,
      onNavigate: (i) => navigateDesignerShell(context, i),
      unreadMessages: 0,
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final item = items[index];
          return Card(
            color: AppTheme.card,
            child: ListTile(
              leading: Icon(item.icon, color: AppTheme.navy),
              title: Text(
                item.label,
                style: const TextStyle(
                  color: AppTheme.navy,
                  fontWeight: FontWeight.w600,
                ),
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (item.gate != null)
                    const Icon(Icons.lock_outline, size: 18, color: AppTheme.muted),
                  const Icon(Icons.chevron_right, color: AppTheme.navy),
                ],
              ),
              onTap: () {
                if (item.gate != null) {
                  guardFeatureNavigation(
                    context,
                    item.gate!,
                    onAllowed: () => context.push(item.route),
                  );
                } else {
                  context.push(item.route);
                }
              },
            ),
          );
        },
      ),
    );
  }
}
