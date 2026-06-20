import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerDiscountsPage extends StatefulWidget {
  const DesignerDiscountsPage({super.key});

  @override
  State<DesignerDiscountsPage> createState() => _DesignerDiscountsPageState();
}

class _DesignerDiscountsPageState extends State<DesignerDiscountsPage> {
  final _repo = sl<DiscountsRepository>();
  List<DiscountEntity> _discounts = [];
  bool _loading = true;
  String? _error;

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
      final items = await _repo.getDiscounts();
      setState(() => _discounts = items);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _showCreateSheet() async {
    final codeController = TextEditingController();
    final nameController = TextEditingController();
    final valueController = TextEditingController(text: '10');
    String type = 'PERCENTAGE';
    String applicability = 'ALL_ORDERS';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Create promotion', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(
                    controller: codeController,
                    decoration: const InputDecoration(labelText: 'Promo code'),
                    textCapitalization: TextCapitalization.characters,
                  ),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: type,
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: const [
                      DropdownMenuItem(value: 'PERCENTAGE', child: Text('Percentage')),
                      DropdownMenuItem(value: 'FIXED_AMOUNT', child: Text('Fixed amount')),
                    ],
                    onChanged: (v) => setSheetState(() => type = v ?? type),
                  ),
                  TextField(
                    controller: valueController,
                    decoration: InputDecoration(
                      labelText: type == 'PERCENTAGE' ? 'Percent off' : 'Amount off (₦)',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: applicability,
                    decoration: const InputDecoration(labelText: 'Applies to'),
                    items: const [
                      DropdownMenuItem(value: 'ALL_ORDERS', child: Text('All orders')),
                      DropdownMenuItem(value: 'FIRST_ORDER', child: Text('First order only')),
                      DropdownMenuItem(value: 'VIP_ONLY', child: Text('VIP customers')),
                      DropdownMenuItem(value: 'MINIMUM_SPEND', child: Text('Minimum spend')),
                    ],
                    onChanged: (v) => setSheetState(() => applicability = v ?? applicability),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () async {
                      await _repo.createDiscount({
                        'code': codeController.text.trim(),
                        'name': nameController.text.trim(),
                        'type': type,
                        'value': double.tryParse(valueController.text) ?? 0,
                        'applicability': applicability,
                        if (applicability == 'MINIMUM_SPEND') 'minOrderAmount': 50000,
                      });
                      if (context.mounted) Navigator.pop(context);
                      await _load();
                    },
                    child: const Text('Create promo'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _testPromo(DiscountEntity discount) async {
    final amountController = TextEditingController(text: '85000');
    final result = await _repo.validateDiscount(
      code: discount.code,
      orderAmount: double.tryParse(amountController.text) ?? 85000,
    );
    if (!mounted) return;
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(result.valid ? 'Valid: ${discount.code}' : 'Invalid'),
        content: Text(
          result.valid
              ? 'Discount: ${formatNgn(result.discountAmount)}\nTotal: ${formatNgn(result.totalAmount)}'
              : result.message ?? 'Cannot apply this promo',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }

  void _navigate(int index) {
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

  @override
  Widget build(BuildContext context) {
    return DesignerShell(
      title: 'Promotions',
      selectedIndex: 0,
      onNavigate: _navigate,
      unreadMessages: 0,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  FilledButton.icon(
                    onPressed: _showCreateSheet,
                    icon: const Icon(Icons.add),
                    label: const Text('New promotion'),
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  if (_discounts.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: Text('No promotions yet')),
                    )
                  else
                    ..._discounts.map(
                      (d) => Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppTheme.primary.withValues(alpha: 0.12),
                            child: Text(d.code.substring(0, 1)),
                          ),
                          title: Text('${d.code} · ${d.name}'),
                          subtitle: Text(
                            d.type == 'PERCENTAGE'
                                ? '${d.value.toStringAsFixed(0)}% off · Used ${d.usedCount}${d.maxUses != null ? '/${d.maxUses}' : ''}'
                                : '${formatNgn(d.value)} off · Used ${d.usedCount}',
                          ),
                          trailing: Switch(
                            value: d.isActive,
                            onChanged: (_) async {
                              await _repo.updateDiscount(d.id, {'isActive': !d.isActive});
                              await _load();
                            },
                          ),
                          onTap: () => _testPromo(d),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
