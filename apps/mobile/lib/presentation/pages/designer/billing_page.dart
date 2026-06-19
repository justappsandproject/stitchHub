import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class BillingPage extends StatefulWidget {
  const BillingPage({super.key});

  @override
  State<BillingPage> createState() => _BillingPageState();
}

class _BillingPageState extends State<BillingPage> {
  List<Map<String, dynamic>> _invoices = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final invoices = await sl<PaymentsRepository>().getInvoices();
      setState(() => _invoices = invoices);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
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
    return DesignerShell(
      title: 'Billing',
      selectedIndex: 4,
      onNavigate: _navigate,
      unreadMessages: 0,
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _loadInvoices,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Client invoices and payments',
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
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_error != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    ),
                  )
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
                  ..._invoices.map((inv) {
                    final order = inv['order'] as Map<String, dynamic>?;
                    final customer = order?['customer'] as Map<String, dynamic>?;
                    final status = inv['status'] as String? ?? '';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(inv['invoiceNumber'] as String? ?? 'Invoice'),
                        subtitle: Text(
                          '${customer?['firstName'] ?? ''} ${customer?['lastName'] ?? ''} · ${order?['orderNumber'] ?? ''}\n${status.replaceAll('_', ' ')}',
                        ),
                        isThreeLine: true,
                        trailing: Text(formatNgn(parseNumOrZero(inv['amount']))),
                      ),
                    );
                  }),
                const SizedBox(height: 80),
              ],
            ),
          ),
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton.extended(
              onPressed: () => _BillingSheet.showAddBillingSheet(context, onSaved: _loadInvoices),
              icon: const Icon(Icons.receipt_long),
              label: const Text('Add billing'),
            ),
          ),
        ],
      ),
    );
  }
}

class _BillingSheet {
  static Future<void> showAddBillingSheet(
    BuildContext context, {
    VoidCallback? onSaved,
  }) async {
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
                                  onSaved?.call();
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
}
