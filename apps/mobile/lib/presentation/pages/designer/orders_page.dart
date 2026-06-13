import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/orders/orders_bloc.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  @override
  void initState() {
    super.initState();
    sl<OrdersBloc>().add(const OrdersLoadRequested());
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
      title: 'Orders',
      selectedIndex: 1,
      onNavigate: _navigate,
      unreadMessages: 0,
      body: BlocBuilder<OrdersBloc, OrdersState>(
        bloc: sl<OrdersBloc>(),
        builder: (context, state) {
          if (state is OrdersLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is OrdersFailure) {
            return Center(child: Text(state.message));
          }
          if (state is OrdersLoaded) {
            if (state.orders.isEmpty) {
              return const Center(child: Text('No orders yet'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final order = state.orders[index];
                return Card(
                  child: ListTile(
                    title: Text(order.orderNumber),
                    subtitle: Text('${order.customerName} · ${order.fabric ?? 'Custom'}'),
                    trailing: orderStatusChip(order.status),
                  ),
                );
              },
            );
          }
          return const SizedBox.shrink();
        },
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
  @override
  void initState() {
    super.initState();
    sl<OrdersBloc>().add(const OrdersLoadRequested());
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
    return CustomerShell(
      title: 'My Orders',
      selectedIndex: 1,
      onNavigate: _navigate,
      body: BlocBuilder<OrdersBloc, OrdersState>(
        bloc: sl<OrdersBloc>(),
        builder: (context, state) {
          if (state is OrdersLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is OrdersLoaded) {
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.orders.length,
              itemBuilder: (context, index) {
                final order = state.orders[index];
                final progress =
                    orderStatusProgress[order.status] ?? 0;
                return Card(
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
              },
            );
          }
          return const Center(child: Text('No orders found'));
        },
      ),
    );
  }
}
