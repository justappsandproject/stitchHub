import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/orders/orders_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    sl<OrdersBloc>().add(OrdersLoadRequested(status: _statusFilter));
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

  Future<void> _showStatusSheet(String orderId, OrderStatus current) async {
    const nextStatuses = [
      OrderStatus.newOrder,
      OrderStatus.measured,
      OrderStatus.cutting,
      OrderStatus.sewing,
      OrderStatus.fitting,
      OrderStatus.finishing,
      OrderStatus.ready,
      OrderStatus.delivered,
      OrderStatus.cancelled,
    ];

    await showModalBottomSheet<void>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Update production stage', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              ...nextStatuses.map(
                (status) => ListTile(
                  leading: orderStatusChip(status),
                  title: Text(status.value.replaceAll('_', ' ')),
                  selected: status == current,
                  onTap: () {
                    sl<OrdersBloc>().add(
                      OrderStatusUpdateRequested(orderId: orderId, status: status.value),
                    );
                    Navigator.pop(context);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openCreateOrder() async {
    final created = await context.push<bool>(AppRouter.designerCreateOrder);
    if (created == true) _load();
  }

  Future<void> _confirmDeleteOrder(String orderId, String orderNumber) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete order?'),
        content: Text('This will permanently remove $orderNumber.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      await sl<OrdersRepository>().deleteOrder(orderId);
      _load();
      sl<DashboardBloc>().add(const DashboardLoadRequested());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DesignerShell(
      title: 'Orders',
      selectedIndex: 1,
      onNavigate: _navigate,
      unreadMessages: 0,
      body: Stack(
        children: [
          Row(
        children: [
          Container(
            width: 108,
            decoration: BoxDecoration(
              border: Border(
                right: BorderSide(color: Theme.of(context).dividerColor),
              ),
              color: Theme.of(context).colorScheme.surfaceContainerLowest,
            ),
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _VerticalFilter(
                  label: 'All',
                  selected: _statusFilter == null,
                  onTap: () => setState(() {
                    _statusFilter = null;
                    _load();
                  }),
                ),
                ...OrderStatus.values.where((s) => s != OrderStatus.measured).map(
                      (status) => _VerticalFilter(
                        label: status.value.replaceAll('_', ' '),
                        selected: _statusFilter == status.value,
                        onTap: () => setState(() {
                          _statusFilter = status.value;
                          _load();
                        }),
                      ),
                    ),
              ],
            ),
          ),
          Expanded(
            child: BlocConsumer<OrdersBloc, OrdersState>(
              bloc: sl<OrdersBloc>(),
              listener: (_, state) {
                if (state is OrdersLoaded || state is OrdersFailure) {
                  if (state is OrdersFailure) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(state.message)),
                    );
                  }
                }
              },
              builder: (context, state) {
                if (state is OrdersLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is OrdersFailure && state.message.isNotEmpty) {
                  return Center(child: Text(state.message));
                }
                if (state is OrdersLoaded) {
                  if (state.orders.isEmpty) {
                    return const Center(child: Text('No orders yet'));
                  }
                  return RefreshIndicator(
                    onRefresh: () async => _load(),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final order = state.orders[index];
                        final progress = orderStatusProgress[order.status] ?? 0;
                        return Card(
                          child: InkWell(
                            onTap: () => _showStatusSheet(order.id, order.status),
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        order.orderNumber,
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          orderStatusChip(order.status),
                                          IconButton(
                                            icon: Icon(
                                              Icons.delete_outline,
                                              color: Theme.of(context).colorScheme.error,
                                              size: 20,
                                            ),
                                            onPressed: () => _confirmDeleteOrder(
                                              order.id,
                                              order.orderNumber,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text('${order.customerName} · ${order.fabric ?? 'Custom'}'),
                                  const SizedBox(height: 10),
                                  LinearProgressIndicator(value: progress / 100),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('$progress% complete'),
                                      Text(formatNgn(order.totalAmount)),
                                    ],
                                  ),
                                  if ((order.balanceAmount ?? 0) > 0)
                                    Text(
                                      'Balance: ${formatNgn(order.balanceAmount!)}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton.extended(
              onPressed: _openCreateOrder,
              icon: const Icon(Icons.add),
              label: const Text('New order'),
            ),
          ),
        ],
      ),
    );
  }
}

class _VerticalFilter extends StatelessWidget {
  const _VerticalFilter({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Theme.of(context).colorScheme.primaryContainer
          : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.bold : FontWeight.w500,
              color: selected
                  ? Theme.of(context).colorScheme.onPrimaryContainer
                  : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

class CustomerOrdersPage extends StatefulWidget {
  const CustomerOrdersPage({super.key});

  @override
  State<CustomerOrdersPage> createState() => _CustomerOrdersPageState();
}

class _CustomerOrdersPageState extends State<CustomerOrdersPage> {
  List<Map<String, dynamic>> _invoices = [];
  bool _loadingInvoices = true;

  @override
  void initState() {
    super.initState();
    sl<OrdersBloc>().add(const OrdersLoadRequested());
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() => _loadingInvoices = true);
    try {
      final invoices = await sl<PaymentsRepository>().getInvoices();
      if (mounted) setState(() => _invoices = invoices);
    } catch (_) {
      // Invoices are optional if API unavailable.
    } finally {
      if (mounted) setState(() => _loadingInvoices = false);
    }
  }

  void _navigate(int index) {
    switch (index) {
      case 0:
        context.go(AppRouter.customerHome);
      case 1:
        context.go(AppRouter.customerStyles);
      case 2:
        context.go(AppRouter.customerOrders);
      case 3:
        context.go(AppRouter.customerMeasurements);
      case 4:
        context.go(AppRouter.settings);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomerShell(
      title: 'My Orders',
      selectedIndex: 2,
      onNavigate: _navigate,
      body: RefreshIndicator(
        onRefresh: () async {
          sl<OrdersBloc>().add(const OrdersLoadRequested());
          await _loadInvoices();
        },
        child: BlocBuilder<OrdersBloc, OrdersState>(
          bloc: sl<OrdersBloc>(),
          builder: (context, state) {
            if (state is OrdersLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            final orders = state is OrdersLoaded ? state.orders : const <OrderEntity>[];

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'My Orders',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                if (state is OrdersLoaded && orders.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('No orders found'),
                    ),
                  )
                else if (state is OrdersLoaded)
                  ...orders.map((order) {
                    final progress = orderStatusProgress[order.status] ?? 0;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  order.orderNumber,
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                orderStatusChip(order.status),
                              ],
                            ),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(value: progress / 100),
                            const SizedBox(height: 8),
                            Text('$progress% complete'),
                            if (order.deliveryDate != null)
                              Text(
                                'Delivery: ${order.deliveryDate!.toLocal().toString().split(' ').first}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: 24),
                Text(
                  'Invoices & receipts',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                if (_loadingInvoices)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_invoices.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'No invoices yet. Your designer will send billing here.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  )
                else
                  ..._invoices.map((inv) {
                    final order = inv['order'] as Map<String, dynamic>?;
                    final status = inv['status'] as String? ?? '';
                    final paid = inv['paidAmount'];
                    final amount = parseNumOrZero(inv['amount']);
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: Icon(
                          status == 'PAID' ? Icons.receipt_long : Icons.receipt_outlined,
                          color: status == 'PAID' ? Colors.green : null,
                        ),
                        title: Text(inv['invoiceNumber'] as String? ?? 'Invoice'),
                        subtitle: Text(
                          '${order?['orderNumber'] ?? 'Order'} · ${status.replaceAll('_', ' ')}'
                          '${paid != null ? '\nPaid ${formatNgn(parseNumOrZero(paid))}' : ''}',
                        ),
                        isThreeLine: paid != null,
                        trailing: Text(formatNgn(amount)),
                      ),
                    );
                  }),
              ],
            );
          },
        ),
      ),
    );
  }
}
