import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
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
          title: 'Billing & Plans',
          selectedIndex: 4,
          onNavigate: _navigate,
          unreadMessages: 0,
          body: switch (state) {
            BillingLoading() || BillingProcessing() =>
              const Center(child: CircularProgressIndicator()),
            BillingLoaded(:final subscription, :final plans, :final paystackEnabled) =>
              ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    color: subscription.isSuspended
                        ? Colors.red.shade50
                        : null,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Current Plan: ${subscription.plan.value}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text('Status: ${subscription.status}'),
                          if (subscription.requiresPayment)
                            const Text(
                              'Payment required to continue',
                              style: TextStyle(color: Colors.red),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...plans.map((plan) {
                    final code = plan['code'] as String? ?? '';
                    final name = plan['name'] as String? ?? code;
                    final price = plan['priceNgn'] as num? ?? 0;
                    return Card(
                      child: ListTile(
                        title: Text(name),
                        subtitle: Text(formatNgn(price)),
                        trailing: FilledButton(
                          onPressed: () {
                            if (paystackEnabled) {
                              sl<BillingBloc>().add(
                                BillingPaystackInitialize(code),
                              );
                            } else {
                              sl<BillingBloc>().add(BillingChangePlan(code));
                            }
                          },
                          child: const Text('Select'),
                        ),
                      ),
                    );
                  }),
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
