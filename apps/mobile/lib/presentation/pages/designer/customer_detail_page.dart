import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

class CustomerDetailPage extends StatefulWidget {
  const CustomerDetailPage({super.key, required this.customerId});

  final String customerId;

  @override
  State<CustomerDetailPage> createState() => _CustomerDetailPageState();
}

class _CustomerDetailPageState extends State<CustomerDetailPage> {
  Map<String, dynamic>? _data;
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
      final data = await sl<CustomersRepository>().getCustomerDetail(widget.customerId);
      setState(() => _data = data);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _confirmDelete() async {
    final firstName = _data?['firstName'] as String? ?? '';
    final lastName = _data?['lastName'] as String? ?? '';
    final name = '$firstName $lastName'.trim();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete customer?'),
        content: Text('This will permanently remove $name and their records.'),
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
      await sl<CustomersRepository>().deleteCustomer(widget.customerId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Customer deleted')),
      );
      context.pop();
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_data != null)
            IconButton(
              icon: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error),
              onPressed: _confirmDelete,
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _data == null
                  ? const Center(child: Text('Not found'))
                  : _CustomerDetailBody(data: _data!, onReload: _load),
    );
  }
}

Future<void> _showTakeMeasurement(
  BuildContext context,
  String customerId,
  Future<void> Function() onSaved,
) async {
  final fields = {
    'Upper Body': ['chestBust', 'shoulderWidth', 'sleeveLength', 'armLength', 'neck', 'armhole'],
    'Lower Body': ['waist', 'hip', 'thigh', 'inseam', 'outseam', 'trouserLength'],
    'Full Body': ['height', 'backLength', 'frontLength', 'dressLength'],
  };
  final controllers = <String, TextEditingController>{};
  for (final section in fields.values) {
    for (final key in section) {
      controllers[key] = TextEditingController();
    }
  }
  final notesController = TextEditingController();
  var unit = 'cm';
  final photoUrls = <String>[];
  var saving = false;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setSheetState) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Take Measurement', style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 12),
              Row(
                children: [
                  ChoiceChip(
                    label: const Text('cm'),
                    selected: unit == 'cm',
                    onSelected: (_) => setSheetState(() => unit = 'cm'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('inches'),
                    selected: unit == 'inches',
                    onSelected: (_) => setSheetState(() => unit = 'inches'),
                  ),
                ],
              ),
              for (final entry in fields.entries) ...[
                const SizedBox(height: 12),
                Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
                for (final key in entry.value)
                  TextField(
                    controller: controllers[key],
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(labelText: key),
                  ),
              ],
              TextField(
                controller: notesController,
                decoration: const InputDecoration(labelText: 'Custom notes'),
                maxLines: 2,
              ),
              TextButton.icon(
                onPressed: () async {
                  final file = await ImagePicker().pickImage(source: ImageSource.gallery);
                  if (file == null) return;
                  final url = await sl<UploadsRepository>().uploadImage(file.path);
                  setSheetState(() => photoUrls.add(url));
                },
                icon: const Icon(Icons.add_a_photo),
                label: const Text('Add reference photo'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        setSheetState(() => saving = true);
                        try {
                          final values = <String, num>{};
                          for (final e in controllers.entries) {
                            final v = double.tryParse(e.value.text.trim());
                            if (v != null) values[e.key] = v;
                          }
                          await sl<MeasurementsRepository>().createBodyMeasurement({
                            'customerId': customerId,
                            'values': values,
                            'unit': unit,
                            'notes': notesController.text.trim().isEmpty
                                ? null
                                : notesController.text.trim(),
                            'photoUrls': photoUrls,
                          });
                          if (ctx.mounted) Navigator.pop(ctx);
                          await onSaved();
                        } catch (e) {
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          }
                        } finally {
                          if (ctx.mounted) setSheetState(() => saving = false);
                        }
                      },
                child: Text(saving ? 'Saving...' : 'Save Measurement'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _CustomerDetailBody extends StatelessWidget {
  const _CustomerDetailBody({required this.data, required this.onReload});

  final Map<String, dynamic> data;
  final Future<void> Function() onReload;

  @override
  Widget build(BuildContext context) {
    final firstName = data['firstName'] as String? ?? '';
    final lastName = data['lastName'] as String? ?? '';
    final measurements = data['measurements'] as List<dynamic>? ?? [];
    final orders = data['orders'] as List<dynamic>? ?? [];
    final tags = (data['tags'] as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    final count = data['_count'] as Map<String, dynamic>? ?? {};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundImage: data['photoUrl'] != null
                  ? CachedNetworkImageProvider(data['photoUrl'] as String)
                  : null,
              child: data['photoUrl'] == null
                  ? Text('${firstName.isNotEmpty ? firstName[0] : '?'}${lastName.isNotEmpty ? lastName[0] : ''}')
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$firstName $lastName',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                      if (data['isVip'] == true)
                        const Chip(label: Text('VIP'), visualDensity: VisualDensity.compact),
                    ],
                  ),
                  Text(data['phone'] as String? ?? ''),
                  if (data['email'] != null) Text(data['email'] as String),
                  Text(
                    '${count['orders'] ?? 0} orders · ${count['measurements'] ?? 0} measurements',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ],
        ),
        if (tags.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            children: tags.map((t) => Chip(label: Text(t), visualDensity: VisualDensity.compact)).toList(),
          ),
        ],
        const SizedBox(height: 20),
        if (data['address'] != null || data['notes'] != null)
          _SectionCard(
            title: 'Profile',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data['address'] != null) Text('Address: ${data['address']}'),
                if (data['gender'] != null) Text('Gender: ${data['gender']}'),
                if (data['notes'] != null) ...[
                  const SizedBox(height: 8),
                  Text(data['notes'] as String),
                ],
              ],
            ),
          ),
        _SectionCard(
          title: 'Measurements',
          child: measurements.isEmpty
              ? const Text('No measurements recorded')
              : Column(
                  children: measurements.map((m) {
                    final map = m as Map<String, dynamic>;
                    final values = map['values'] as Map<String, dynamic>? ?? {};
                    final template = map['template'] as Map<String, dynamic>?;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              template?['name'] as String? ?? 'Measurement',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: values.entries
                                  .map((e) => Chip(
                                        label: Text('${e.key}: ${e.value}'),
                                        visualDensity: VisualDensity.compact,
                                      ))
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ),
        _SectionCard(
          title: 'Order history',
          child: orders.isEmpty
              ? const Text('No orders yet')
              : Column(
                  children: orders.map((o) {
                    final order = o as Map<String, dynamic>;
                    final style = order['style'] as Map<String, dynamic>?;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(order['orderNumber'] as String? ?? ''),
                      subtitle: style != null ? Text('${style['name']} · ${style['category']}') : null,
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            (order['status'] as String? ?? '').replaceAll('_', ' '),
                            style: const TextStyle(fontSize: 12),
                          ),
                          Text(formatNgn(parseNumOrZero(order['totalAmount']))),
                        ],
                      ),
                    );
                  }).toList(),
                ),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: () => _showTakeMeasurement(
            context,
            data['id'] as String,
            onReload,
          ),
          icon: const Icon(Icons.straighten),
          label: const Text('Take Measurement'),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: () => context.push(
            '${AppRouter.designerMeasurements}?customerId=${data['id']}&name=${Uri.encodeComponent('$firstName $lastName')}',
          ),
          icon: const Icon(Icons.straighten),
          label: const Text('Manage measurements'),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}
