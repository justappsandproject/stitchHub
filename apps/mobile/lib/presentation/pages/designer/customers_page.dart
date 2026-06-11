import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});

  @override
  State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  late Future<List<CustomerEntity>> _future;

  @override
  void initState() {
    super.initState();
    _future = sl<CustomersRepository>().getCustomers();
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
      title: 'Customers',
      selectedIndex: 2,
      onNavigate: _navigate,
      unreadMessages: 0,
      body: FutureBuilder<List<CustomerEntity>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final customers = snapshot.data ?? [];
          if (customers.isEmpty) {
            return const Center(child: Text('No customers yet'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: customers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final customer = customers[index];
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    child: Text(customer.firstName.isNotEmpty
                        ? customer.firstName[0]
                        : '?'),
                  ),
                  title: Text(customer.fullName),
                  subtitle: Text(customer.phone),
                  trailing: customer.isVip
                      ? const Chip(label: Text('VIP'))
                      : null,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
