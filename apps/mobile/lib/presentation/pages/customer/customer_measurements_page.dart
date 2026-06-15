import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class CustomerMeasurementsPage extends StatefulWidget {
  const CustomerMeasurementsPage({super.key});

  @override
  State<CustomerMeasurementsPage> createState() => _CustomerMeasurementsPageState();
}

class _CustomerMeasurementsPageState extends State<CustomerMeasurementsPage> {
  late Future<List<MeasurementEntity>> _future;

  @override
  void initState() {
    super.initState();
    _future = sl<MeasurementsRepository>().getMine();
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
      title: 'My Measurements',
      selectedIndex: 3,
      onNavigate: _navigate,
      body: FutureBuilder<List<MeasurementEntity>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final measurements = snapshot.data ?? [];
          if (measurements.isEmpty) {
            return const Center(child: Text('No measurements on file yet'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: measurements.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final measurement = measurements[index];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${measurement.templateName} · v${measurement.version}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: measurement.fields.map((field) {
                          return Chip(
                            label: Text(
                              '${field.label}: ${measurement.values[field.key] ?? '—'} ${field.unit}',
                            ),
                          );
                        }).toList(),
                      ),
                      if (measurement.notes != null) ...[
                        const SizedBox(height: 8),
                        Text(measurement.notes!),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
