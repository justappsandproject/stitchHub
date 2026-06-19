import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _data == null
                  ? const Center(child: Text('Not found'))
                  : _CustomerDetailBody(data: _data!),
    );
  }
}

class _CustomerDetailBody extends StatelessWidget {
  const _CustomerDetailBody({required this.data});

  final Map<String, dynamic> data;

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
