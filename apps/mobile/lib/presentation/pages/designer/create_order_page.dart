import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

class CreateOrderPage extends StatefulWidget {
  const CreateOrderPage({super.key});

  @override
  State<CreateOrderPage> createState() => _CreateOrderPageState();
}

class _CreateOrderPageState extends State<CreateOrderPage> {
  final _pageController = PageController();
  int _step = 0;
  bool _saving = false;

  List<CustomerEntity> _customers = [];
  CustomerEntity? _selectedCustomer;
  String _customerQuery = '';

  List<StyleEntity> _styles = [];
  StyleEntity? _selectedStyle;
  final _fabricController = TextEditingController();
  final _notesController = TextEditingController();
  final _totalController = TextEditingController();
  final _depositController = TextEditingController();
  DateTime? _dueDate;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fabricController.dispose();
    _notesController.dispose();
    _totalController.dispose();
    _depositController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final customers = await sl<CustomersRepository>().getCustomers();
    final styles = await sl<StylesRepository>().getStyles();
    setState(() {
      _customers = customers;
      _styles = styles.where((s) => s.isActive).toList();
    });
  }

  List<CustomerEntity> get _filteredCustomers {
    if (_customerQuery.isEmpty) return _customers;
    final q = _customerQuery.toLowerCase();
    return _customers.where((c) {
      return '${c.firstName} ${c.lastName}'.toLowerCase().contains(q) ||
          c.phone.contains(q);
    }).toList();
  }

  void _next() {
    if (_step < 2) {
      setState(() => _step++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _back() {
    if (_step > 0) {
      setState(() => _step--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.pop();
    }
  }

  Future<void> _submit() async {
    if (_selectedCustomer == null) return;
    setState(() => _saving = true);
    try {
      final total = double.tryParse(_totalController.text) ?? 0;
      if (_selectedStyle != null && total == 0 && _selectedStyle!.basePrice != null) {
        _totalController.text = _selectedStyle!.basePrice!.toStringAsFixed(0);
      }
      await sl<OrdersRepository>().createOrder({
        'customerId': _selectedCustomer!.id,
        if (_selectedStyle != null) 'styleId': _selectedStyle!.id,
        if (_fabricController.text.trim().isNotEmpty) 'fabric': _fabricController.text.trim(),
        if (_notesController.text.trim().isNotEmpty) 'notes': _notesController.text.trim(),
        'totalAmount': double.tryParse(_totalController.text) ?? 0,
        if (_depositController.text.trim().isNotEmpty)
          'depositAmount': double.tryParse(_depositController.text),
        if (_dueDate != null) 'deliveryDate': _dueDate!.toIso8601String().split('T').first,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order created successfully')),
      );
      context.pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New order'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: List.generate(3, (i) {
                final active = i <= _step;
                return Expanded(
                  child: Container(
                    margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                    height: 4,
                    decoration: BoxDecoration(
                      color: active ? AppTheme.accent : AppTheme.border,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _StepCustomer(
                  customers: _filteredCustomers,
                  selected: _selectedCustomer,
                  query: _customerQuery,
                  onQueryChanged: (v) => setState(() => _customerQuery = v),
                  onSelect: (c) => setState(() => _selectedCustomer = c),
                ),
                _StepItems(
                  styles: _styles,
                  selectedStyle: _selectedStyle,
                  onSelectStyle: (s) {
                    setState(() {
                      _selectedStyle = s;
                      if (s.basePrice != null) {
                        _totalController.text = s.basePrice!.toStringAsFixed(0);
                        _fabricController.text = s.name;
                      }
                    });
                  },
                  fabricController: _fabricController,
                  totalController: _totalController,
                ),
                _StepDetails(
                  customer: _selectedCustomer,
                  style: _selectedStyle,
                  notesController: _notesController,
                  depositController: _depositController,
                  dueDate: _dueDate,
                  onPickDate: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 14)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) setState(() => _dueDate = picked);
                  },
                ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton(
                onPressed: _saving
                    ? null
                    : () {
                        if (_step == 0 && _selectedCustomer == null) return;
                        if (_step < 2) {
                          _next();
                        } else {
                          _submit();
                        }
                      },
                child: Text(
                  _saving
                      ? 'Creating...'
                      : _step < 2
                          ? 'Next'
                          : 'Confirm order',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepCustomer extends StatelessWidget {
  const _StepCustomer({
    required this.customers,
    required this.selected,
    required this.query,
    required this.onQueryChanged,
    required this.onSelect,
  });

  final List<CustomerEntity> customers;
  final CustomerEntity? selected;
  final String query;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<CustomerEntity> onSelect;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Select customer', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        TextField(
          decoration: const InputDecoration(
            labelText: 'Search customers',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: onQueryChanged,
        ),
        const SizedBox(height: 12),
        ...customers.map((c) {
          final isSelected = selected?.id == c.id;
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              side: BorderSide(
                color: isSelected ? AppTheme.accent : AppTheme.border,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: ListTile(
              onTap: () => onSelect(c),
              leading: CircleAvatar(
                backgroundColor: AppTheme.accentLight,
                child: Text(c.firstName.isNotEmpty ? c.firstName[0] : '?'),
              ),
              title: Text('${c.firstName} ${c.lastName}'),
              subtitle: Text(c.phone),
              trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.accent) : null,
            ),
          );
        }),
      ],
    );
  }
}

class _StepItems extends StatelessWidget {
  const _StepItems({
    required this.styles,
    required this.selectedStyle,
    required this.onSelectStyle,
    required this.fabricController,
    required this.totalController,
  });

  final List<StyleEntity> styles;
  final StyleEntity? selectedStyle;
  final ValueChanged<StyleEntity> onSelectStyle;
  final TextEditingController fabricController;
  final TextEditingController totalController;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Add items', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        if (styles.isNotEmpty) ...[
          Text('From Style Store', style: Theme.of(context).textTheme.labelSmall),
          const SizedBox(height: 8),
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: styles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final style = styles[index];
                final selected = selectedStyle?.id == style.id;
                return GestureDetector(
                  onTap: () => onSelectStyle(style),
                  child: Container(
                    width: 100,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      border: Border.all(
                        color: selected ? AppTheme.accent : AppTheme.border,
                        width: selected ? 2 : 1,
                      ),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            style.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                        if (style.basePrice != null)
                          Text('₦${style.basePrice!.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
        TextField(
          controller: fabricController,
          decoration: const InputDecoration(labelText: 'Item / fabric name'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: totalController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Total amount (₦)'),
        ),
      ],
    );
  }
}

class _StepDetails extends StatelessWidget {
  const _StepDetails({
    required this.customer,
    required this.style,
    required this.notesController,
    required this.depositController,
    required this.dueDate,
    required this.onPickDate,
  });

  final CustomerEntity? customer;
  final StyleEntity? style;
  final TextEditingController notesController;
  final TextEditingController depositController;
  final DateTime? dueDate;
  final VoidCallback onPickDate;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Confirm details', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Customer: ${customer?.firstName ?? ''} ${customer?.lastName ?? ''}'),
                if (style != null) Text('Style: ${style!.name}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: onPickDate,
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(
            dueDate == null
                ? 'Pick due date'
                : 'Due: ${dueDate!.toLocal().toString().split(' ').first}',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: depositController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Deposit paid (₦)'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: notesController,
          decoration: const InputDecoration(labelText: 'Order notes'),
          maxLines: 3,
        ),
      ],
    );
  }
}
