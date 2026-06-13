import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

class DesignerMeasurementsPage extends StatefulWidget {
  const DesignerMeasurementsPage({
    super.key,
    this.customerId,
    this.customerName,
  });

  final String? customerId;
  final String? customerName;

  @override
  State<DesignerMeasurementsPage> createState() => _DesignerMeasurementsPageState();
}

class _DesignerMeasurementsPageState extends State<DesignerMeasurementsPage> {
  List<CustomerEntity> _customers = [];
  List<MeasurementTemplateEntity> _templates = [];
  List<MeasurementEntity> _measurements = [];
  String? _selectedCustomerId;
  String? _selectedTemplateId;
  final _values = <String, TextEditingController>{};
  final _notesController = TextEditingController();
  MeasurementEntity? _editing;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedCustomerId = widget.customerId;
    _loadInitial();
  }

  @override
  void dispose() {
    _notesController.dispose();
    for (final controller in _values.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadInitial() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        sl<CustomersRepository>().getCustomers(),
        sl<MeasurementsRepository>().getTemplates(),
      ]);
      _customers = results[0] as List<CustomerEntity>;
      _templates = results[1] as List<MeasurementTemplateEntity>;
      if (_selectedCustomerId == null && _customers.isNotEmpty) {
        _selectedCustomerId = _customers.first.id;
      }
      if (_templates.isNotEmpty) {
        _selectedTemplateId = _templates.first.id;
        _initFields(_templates.first);
      }
      await _loadMeasurements();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _loading = false);
    }
  }

  void _initFields(MeasurementTemplateEntity template, [MeasurementEntity? existing]) {
    for (final controller in _values.values) {
      controller.dispose();
    }
    _values.clear();
    for (final field in template.fields) {
      final value = existing?.values[field.key]?.toString() ?? '';
      _values[field.key] = TextEditingController(text: value);
    }
    _notesController.text = existing?.notes ?? '';
  }

  Future<void> _loadMeasurements() async {
    final customerId = _selectedCustomerId;
    if (customerId == null) {
      setState(() => _measurements = []);
      return;
    }
    final list = await sl<MeasurementsRepository>().getByCustomer(customerId);
    setState(() => _measurements = list);
  }

  Future<void> _saveMeasurement() async {
    final customerId = _selectedCustomerId;
    final templateId = _selectedTemplateId;
    if (customerId == null || templateId == null) return;

    setState(() => _saving = true);
    try {
      final values = <String, num>{};
      for (final entry in _values.entries) {
        values[entry.key] = num.tryParse(entry.value.text.trim()) ?? 0;
      }
      final payload = {
        'values': values,
        if (_notesController.text.trim().isNotEmpty) 'notes': _notesController.text.trim(),
      };

      if (_editing != null) {
        await sl<MeasurementsRepository>().updateMeasurement(_editing!.id, payload);
      } else {
        await sl<MeasurementsRepository>().createMeasurement({
          'customerId': customerId,
          'templateId': templateId,
          ...payload,
        });
      }

      final wasEdit = _editing != null;
      _editing = null;
      await _loadMeasurements();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(wasEdit ? 'Measurement updated' : 'Measurement saved')),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _saving = false);
    }
  }

  void _startEdit(MeasurementEntity measurement) {
    final template = _templates.firstWhere(
      (t) => t.id == measurement.templateId,
      orElse: () => _templates.first,
    );
    setState(() {
      _editing = measurement;
      _selectedTemplateId = template.id;
      _initFields(template, measurement);
    });
  }

  @override
  Widget build(BuildContext context) {
    final selectedTemplate = _templates.where((t) => t.id == _selectedTemplateId).cast<MeasurementTemplateEntity?>().firstOrNull;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.customerName ?? 'Measurements'),
        actions: [
          TextButton(
            onPressed: () => context.go(AppRouter.designerCustomers),
            child: const Text('Customers'),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                DropdownButtonFormField<String>(
                  key: ValueKey('customer-$_selectedCustomerId'),
                  initialValue: _selectedCustomerId,
                  decoration: const InputDecoration(labelText: 'Customer'),
                  items: _customers
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.fullName)))
                      .toList(),
                  onChanged: (value) async {
                    setState(() => _selectedCustomerId = value);
                    await _loadMeasurements();
                  },
                ),
                const SizedBox(height: 16),
                if (_templates.isNotEmpty)
                  DropdownButtonFormField<String>(
                    key: ValueKey('template-$_selectedTemplateId'),
                    initialValue: _selectedTemplateId,
                    decoration: const InputDecoration(labelText: 'Template'),
                    items: _templates
                        .map((t) => DropdownMenuItem(value: t.id, child: Text(t.name)))
                        .toList(),
                    onChanged: (value) {
                      final template = _templates.firstWhere((t) => t.id == value);
                      setState(() {
                        _selectedTemplateId = value;
                        _editing = null;
                        _initFields(template);
                      });
                    },
                  ),
                if (selectedTemplate != null) ...[
                  const SizedBox(height: 16),
                  Text(_editing == null ? 'Create measurement' : 'Edit measurement v${_editing!.version}'),
                  ...selectedTemplate.fields.map((field) {
                    final controller = _values[field.key] ?? TextEditingController();
                    _values[field.key] = controller;
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextField(
                        controller: controller,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(labelText: '${field.label} (${field.unit})'),
                      ),
                    );
                  }),
                  TextField(
                    controller: _notesController,
                    decoration: const InputDecoration(labelText: 'Notes'),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _saving ? null : _saveMeasurement,
                    child: Text(_saving ? 'Saving...' : (_editing == null ? 'Save measurement' : 'Update measurement')),
                  ),
                ],
                const SizedBox(height: 24),
                const Text('Saved measurements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                if (_measurements.isEmpty)
                  const Text('No measurements yet')
                else
                  ..._measurements.map(
                    (m) => Card(
                      child: ListTile(
                        title: Text('${m.templateName} · v${m.version}'),
                        subtitle: Text(m.notes ?? 'Updated ${m.createdAt.toLocal()}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.edit_outlined),
                          onPressed: () => _startEdit(m),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    final iterator = this.iterator;
    if (!iterator.moveNext()) return null;
    return iterator.current;
  }
}
