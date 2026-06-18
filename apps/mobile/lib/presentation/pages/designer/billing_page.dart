import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/billing/billing_bloc.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/paystack_checkout_page.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class BillingPage extends StatefulWidget {
  const BillingPage({super.key});

  @override
  State<BillingPage> createState() => _BillingPageState();
}

class _BillingPageState extends State<BillingPage> {
  @override
  void initState() {
    super.initState();
    sl<BillingBloc>().add(const BillingLoadRequested());
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BillingBloc, BillingState>(
      bloc: sl<BillingBloc>(),
      listener: (context, state) {
        if (state is BillingCheckoutReady) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PaystackCheckoutPage(
                authorizationUrl: state.checkout.authorizationUrl,
                reference: state.checkout.reference,
              ),
            ),
          );
        }
        if (state is BillingFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      builder: (context, state) {
        return DesignerShell(
          title: 'Billing',
          selectedIndex: 4,
          onNavigate: _navigate,
          unreadMessages: 0,
          body: switch (state) {
            BillingLoading() || BillingProcessing() =>
              const Center(child: CircularProgressIndicator()),
            BillingLoaded(:final subscription, :final plans, :final paystackEnabled) =>
              Stack(
                children: [
                  _BillingBody(
                    subscription: subscription,
                    plans: plans,
                    paystackEnabled: paystackEnabled,
                  ),
                  Positioned(
                    right: 16,
                    bottom: 16,
                    child: FloatingActionButton.extended(
                      onPressed: () => _BillingBody.showAddBillingSheet(context),
                      icon: const Icon(Icons.receipt_long),
                      label: const Text('Add billing'),
                    ),
                  ),
                ],
              ),
            BillingFailure(:final message) => Center(child: Text(message)),
            _ => const SizedBox.shrink(),
          },
        );
      },
    );
  }
}

class _BillingBody extends StatefulWidget {
  const _BillingBody({
    required this.subscription,
    required this.plans,
    required this.paystackEnabled,
  });

  final SubscriptionEntity subscription;
  final List<Map<String, dynamic>> plans;
  final bool paystackEnabled;

  static Future<void> showAddBillingSheet(BuildContext context) async {
    final customers = await sl<CustomersRepository>().getCustomers();
    if (!context.mounted) return;

    String? customerId;
    final selectedOrders = <String>{};
    List<OrderEntity> customerOrders = [];
    var loadingOrders = false;
    var saving = false;
    var recordPayment = true;
    var paymentMethod = 'cash';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            Future<void> loadOrders(String id) async {
              setSheetState(() => loadingOrders = true);
              try {
                final orders =
                    await sl<OrdersRepository>().getOrders(customerId: id);
                customerOrders = orders.where((order) {
                  final balance = order.balanceAmount ?? order.totalAmount;
                  return balance > 0;
                }).toList();
                selectedOrders.clear();
              } finally {
                if (context.mounted) setSheetState(() => loadingOrders = false);
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Add client billing',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: customerId,
                      decoration: const InputDecoration(labelText: 'Client *'),
                      items: customers
                          .map(
                            (c) => DropdownMenuItem(
                              value: c.id,
                              child: Text('${c.firstName} ${c.lastName}'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) async {
                        setSheetState(() => customerId = v);
                        if (v != null) await loadOrders(v);
                      },
                    ),
                    if (loadingOrders)
                      const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (customerId != null && customerOrders.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No orders for this client'),
                      )
                    else if (customerOrders.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Text(
                        'Attach to orders',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      ...customerOrders.map((order) {
                        final balance = order.balanceAmount ?? order.totalAmount;
                        return CheckboxListTile(
                          value: selectedOrders.contains(order.id),
                          onChanged: (checked) {
                            setSheetState(() {
                              if (checked == true) {
                                selectedOrders.add(order.id);
                              } else {
                                selectedOrders.remove(order.id);
                              }
                            });
                          },
                          title: Text(order.orderNumber),
                          subtitle: Text(
                            '${order.customerName} · Balance ${formatNgn(balance)}',
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Record payment now'),
                      subtitle: const Text('Creates invoice and logs payment'),
                      value: recordPayment,
                      onChanged: (v) => setSheetState(() => recordPayment = v),
                    ),
                    if (recordPayment) ...[
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: paymentMethod,
                        decoration: const InputDecoration(labelText: 'Payment method'),
                        items: const [
                          DropdownMenuItem(value: 'cash', child: Text('Cash')),
                          DropdownMenuItem(value: 'bank_transfer', child: Text('Bank transfer')),
                          DropdownMenuItem(value: 'card', child: Text('Card')),
                          DropdownMenuItem(value: 'paystack', child: Text('Paystack')),
                        ],
                        onChanged: (v) {
                          if (v != null) setSheetState(() => paymentMethod = v);
                        },
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: saving ||
                              customerId == null ||
                              selectedOrders.isEmpty
                          ? null
                          : () async {
                              setSheetState(() => saving = true);
                              try {
                                for (final orderId in selectedOrders) {
                                  final order = customerOrders
                                      .firstWhere((o) => o.id == orderId);
                                  final amount =
                                      order.balanceAmount ?? order.totalAmount;
                                  final invoice =
                                      await sl<PaymentsRepository>().createInvoice(
                                    orderId: orderId,
                                    amount: amount,
                                  );
                                  if (recordPayment) {
                                    await sl<PaymentsRepository>().createPayment(
                                      amount: amount,
                                      method: paymentMethod,
                                      invoiceId: invoice['id'] as String?,
                                    );
                                  }
                                }
                                if (context.mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        recordPayment
                                            ? 'Billing and payment recorded'
                                            : 'Billing entries created',
                                      ),
                                    ),
                                  );
                                }
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(e.toString())),
                                  );
                                }
                              } finally {
                                if (context.mounted) {
                                  setSheetState(() => saving = false);
                                }
                              }
                            },
                      child: Text(saving ? 'Saving...' : 'Create billing'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  State<_BillingBody> createState() => _BillingBodyState();
}

class _BillingBodyState extends State<_BillingBody> {
  List<Map<String, dynamic>> _invoices = [];
  bool _loadingInvoices = true;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    try {
      final invoices = await sl<PaymentsRepository>().getInvoices();
      if (mounted) setState(() => _invoices = invoices);
    } catch (_) {
      // Invoices are optional if API unavailable.
    } finally {
      if (mounted) setState(() => _loadingInvoices = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subscription = widget.subscription;
    final plans = widget.plans;
    final paystackEnabled = widget.paystackEnabled;
    final suspended = subscription.isSuspended ||
        subscription.requiresPayment ||
        subscription.status == 'PAST_DUE';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Client billing & subscription',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 16),
        Text(
          'Recent invoices',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        if (_loadingInvoices)
          const Center(child: CircularProgressIndicator())
        else if (_invoices.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No invoices yet. Tap Add billing to create one from a client order.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          )
        else
          ..._invoices.take(5).map((inv) {
            final order = inv['order'] as Map<String, dynamic>?;
            final customer = order?['customer'] as Map<String, dynamic>?;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(inv['invoiceNumber'] as String? ?? 'Invoice'),
                subtitle: Text(
                  '${customer?['firstName'] ?? ''} ${customer?['lastName'] ?? ''} · ${order?['orderNumber'] ?? ''}',
                ),
                trailing: Text(formatNgn((inv['amount'] as num?) ?? 0)),
              ),
            );
          }),
        const SizedBox(height: 24),
        Text(
          'Your subscription plan and usage',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        if (suspended) ...[
          const SizedBox(height: 16),
          Card(
            color: Colors.amber.shade50,
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Your trial has ended or payment is required. Choose a plan below to restore access.',
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${subscription.configName ?? subscription.plan.value} plan',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        subscription.status.replaceAll('_', ' '),
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                if (subscription.priceNgn != null)
                  Text(
                    '${formatNgn(subscription.priceNgn!)}/month',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                if (subscription.currentPeriodEnd != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      subscription.status == 'TRIALING' ? 'Trial ends' : 'Renews'
                      ' ${subscription.currentPeriodEnd!.toLocal().toString().split(' ').first}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                const SizedBox(height: 16),
                if (subscription.usageCustomers != null)
                  _UsageBar(
                    label: 'Customers',
                    used: subscription.usageCustomers!,
                    limit: subscription.maxCustomers,
                  ),
                if (subscription.usageOrdersThisMonth != null) ...[
                  const SizedBox(height: 12),
                  _UsageBar(
                    label: 'Orders this month',
                    used: subscription.usageOrdersThisMonth!,
                    limit: subscription.maxOrdersPerMonth,
                  ),
                ],
                if (subscription.usageMeasurements != null) ...[
                  const SizedBox(height: 12),
                  _UsageBar(
                    label: 'Measurements',
                    used: subscription.usageMeasurements!,
                    limit: null,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Plans',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        ...plans.map((plan) {
          final code = plan['plan'] as String? ?? plan['code'] as String? ?? '';
          final name = plan['name'] as String? ?? code;
          final price = plan['priceNgn'] as num? ?? 0;
          final tagline = plan['tagline'] as String? ?? '';
          final features = (plan['features'] as List<dynamic>? ?? [])
              .map((e) => e.toString())
              .toList();
          final isCurrent = subscription.plan.value == code;
          final isPopular = code == 'PROFESSIONAL';

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: isCurrent
                    ? AppTheme.gold
                    : isPopular
                        ? AppTheme.primary
                        : Theme.of(context).dividerColor,
                width: isCurrent || isPopular ? 2 : 1,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isPopular)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Most popular',
                        style: TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  if (tagline.isNotEmpty)
                    Text(tagline, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Text(
                    '${formatNgn(price)}/month',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
                  ),
                  const SizedBox(height: 12),
                  ...features.take(5).map(
                        (f) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.check, size: 16, color: Colors.green.shade600),
                              const SizedBox(width: 6),
                              Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                            ],
                          ),
                        ),
                      ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: isCurrent && !suspended
                          ? null
                          : () {
                              if (paystackEnabled) {
                                sl<BillingBloc>().add(BillingPaystackInitialize(code));
                              } else {
                                sl<BillingBloc>().add(BillingChangePlan(code));
                              }
                            },
                      child: Text(isCurrent && !suspended ? 'Current plan' : 'Select plan'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _UsageBar extends StatelessWidget {
  const _UsageBar({
    required this.label,
    required this.used,
    required this.limit,
  });

  final String label;
  final int used;
  final int? limit;

  @override
  Widget build(BuildContext context) {
    final pct = limit != null && limit! > 0
        ? (used / limit!).clamp(0.0, 1.0)
        : (used > 0 ? 0.08 : 0.0);
    final nearLimit = limit != null && limit! > 0 && used / limit! >= 0.8;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            Text(
              '$used / ${limit ?? '∞'}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: nearLimit ? Colors.red : null,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
            color: nearLimit ? Colors.red : AppTheme.primary,
          ),
        ),
      ],
    );
  }
}
