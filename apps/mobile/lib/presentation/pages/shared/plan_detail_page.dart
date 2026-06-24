import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

const _planOrder = [
  SubscriptionPlan.free,
  SubscriptionPlan.starter,
  SubscriptionPlan.professional,
  SubscriptionPlan.enterprise,
];

class PlanDetailPage extends StatefulWidget {
  const PlanDetailPage({super.key});

  @override
  State<PlanDetailPage> createState() => _PlanDetailPageState();
}

class _PlanDetailPageState extends State<PlanDetailPage> {
  SubscriptionEntity? _subscription;
  List<Map<String, dynamic>> _plans = [];
  bool _loading = true;
  String? _error;
  String? _changingPlan;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final sub = await sl<SubscriptionRepository>().getCurrent();
      final plans = await sl<SubscriptionRepository>().getPlans();
      setState(() {
        _subscription = sub;
        _plans = plans;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changePlan(String plan) async {
    setState(() => _changingPlan = plan);
    try {
      await sl<SubscriptionRepository>().changePlan(plan);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Plan updated to $plan')),
      );
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _changingPlan = null);
    }
  }

  int _planRank(SubscriptionPlan plan) {
    final index = _planOrder.indexOf(plan);
    return index < 0 ? 0 : index;
  }

  String? _planKey(Map<String, dynamic> plan) {
    return plan['plan'] as String? ?? plan['key'] as String?;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Current plan')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        FilledButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
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
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.accentLight,
                                    borderRadius:
                                        BorderRadius.circular(AppTheme.radiusLg),
                                  ),
                                  child: Text(
                                    _subscription!.configName ??
                                        _subscription!.plan.value,
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
                        Text(
                          'Available plans',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        ..._plans.map((plan) {
                          final planKey = _planKey(plan);
                          final name = plan['name'] as String? ?? planKey ?? '';
                          final price = plan['priceNgn'] as num?;
                          final features = (plan['features'] as List<dynamic>? ?? [])
                              .map((e) => e.toString())
                              .take(4)
                              .toList();
                          final currentPlan = _subscription!.plan.value;
                          final isCurrent = planKey == currentPlan;
                          final targetPlan = planKey != null
                              ? SubscriptionPlan.fromString(planKey)
                              : _subscription!.plan;
                          final rankDelta = _planRank(targetPlan) -
                              _planRank(_subscription!.plan);
                          final actionLabel = isCurrent
                              ? 'Current plan'
                              : rankDelta > 0
                                  ? 'Upgrade'
                                  : 'Downgrade';

                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      if (price != null)
                                        Text('${formatNgn(price.toInt())}/mo'),
                                    ],
                                  ),
                                  ...features.map(
                                    (f) => Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.check,
                                            size: 16,
                                            color: AppTheme.success,
                                          ),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              f,
                                              style: const TextStyle(fontSize: 13),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  FilledButton(
                                    onPressed: isCurrent || planKey == null
                                        ? null
                                        : _changingPlan != null
                                            ? null
                                            : () => _changePlan(planKey),
                                    child: Text(
                                      _changingPlan == planKey
                                          ? 'Updating...'
                                          : actionLabel,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: () => context.go(AppRouter.designerBilling),
                          child: const Text('Payment & billing'),
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
