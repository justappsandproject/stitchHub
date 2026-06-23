import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

enum GatedFeature { styleStore, messaging, financialReports, staffManagement }

extension SubscriptionFeatures on SubscriptionEntity {
  bool get isFreePlan => plan == SubscriptionPlan.free;

  bool isFeatureLocked(GatedFeature feature) {
    if (!isFreePlan) return false;
    return switch (feature) {
      GatedFeature.styleStore => true,
      GatedFeature.messaging => true,
      GatedFeature.financialReports => true,
      GatedFeature.staffManagement => true,
    };
  }
}

Future<SubscriptionEntity?> loadCurrentSubscription() async {
  try {
    return await sl<SubscriptionRepository>().getCurrent();
  } catch (_) {
    return null;
  }
}

void showPlanUpgradeSheet(BuildContext context, {String? message}) {
  showModalBottomSheet<void>(
    context: context,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.lock_outline, color: AppTheme.navy),
              SizedBox(width: 8),
              Text(
                'Plan limit reached',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.navy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            message ??
                'This feature is not available on the Free plan. Upgrade to unlock it.',
            style: const TextStyle(color: AppTheme.navy, fontSize: 15),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.push(AppRouter.planDetail);
            },
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: const Text('Upgrade Plan'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => Navigator.pop(ctx),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: const Text('Not now'),
          ),
        ],
      ),
    ),
  );
}

Future<bool> guardFeatureNavigation(
  BuildContext context,
  GatedFeature feature, {
  required VoidCallback onAllowed,
}) async {
  final sub = await loadCurrentSubscription();
  if (sub != null && sub.isFeatureLocked(feature)) {
    if (!context.mounted) return false;
    showPlanUpgradeSheet(context);
    return false;
  }
  onAllowed();
  return true;
}

void navigateDesignerShell(BuildContext context, int index) {
  void go() {
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

  if (index == 2) {
    guardFeatureNavigation(context, GatedFeature.messaging, onAllowed: go);
  } else {
    go();
  }
}
