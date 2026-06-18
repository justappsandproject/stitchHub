import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

class PlanDetailPage extends StatefulWidget {
  const PlanDetailPage({super.key});

  @override
  State<PlanDetailPage> createState() => _PlanDetailPageState();
}

class _PlanDetailPageState extends State<PlanDetailPage> {
  SubscriptionEntity? _subscription;
  List<Map<String, dynamic>> _plans = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final sub = await sl<SubscriptionRepository>().getCurrent();
      final plans = await sl<SubscriptionRepository>().getPlans();
      setState(() {
        _subscription = sub;
        _plans = plans;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Current plan')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _subscription == null
              ? const Center(child: Text('Unable to load plan'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.accentLight,
                                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                              ),
                              child: Text(
                                _subscription!.configName ?? _subscription!.plan.value,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.navy,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Status: ${_subscription!.status.replaceAll('_', ' ')}',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            if (_subscription!.priceNgn != null)
                              Text('${formatNgn(_subscription!.priceNgn!)}/month'),
                            if (_subscription!.currentPeriodEnd != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  'Renews ${_subscription!.currentPeriodEnd!.toLocal().toString().split(' ').first}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Usage', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    if (_subscription!.usageCustomers != null)
                      _UsageRow(
                        label: 'Customers',
                        used: _subscription!.usageCustomers!,
                        limit: _subscription!.maxCustomers,
                      ),
                    if (_subscription!.usageOrdersThisMonth != null)
                      _UsageRow(
                        label: 'Orders this month',
                        used: _subscription!.usageOrdersThisMonth!,
                        limit: _subscription!.maxOrdersPerMonth,
                      ),
                    const SizedBox(height: 24),
                    Text('Available plans', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ..._plans.map((plan) {
                      final name = plan['name'] as String? ?? plan['plan'] as String? ?? '';
                      final features = (plan['features'] as List<dynamic>? ?? [])
                          .map((e) => e.toString())
                          .take(4)
                          .toList();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              ...features.map(
                                (f) => Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.check, size: 16, color: AppTheme.success),
                                      const SizedBox(width: 6),
                                      Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.go(AppRouter.designerBilling),
                      child: const Text('Upgrade plan'),
                    ),
                  ],
                ),
    );
  }
}

class _UsageRow extends StatelessWidget {
  const _UsageRow({required this.label, required this.used, this.limit});

  final String label;
  final int used;
  final int? limit;

  @override
  Widget build(BuildContext context) {
    final pct = limit != null && limit! > 0 ? (used / limit!).clamp(0.0, 1.0) : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label),
              Text('$used / ${limit ?? '∞'}'),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: pct,
            backgroundColor: AppTheme.border,
            color: AppTheme.accent,
            minHeight: 6,
            borderRadius: BorderRadius.circular(999),
          ),
        ],
      ),
    );
  }
}
