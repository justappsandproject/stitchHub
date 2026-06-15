import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class CustomerPortfolioPage extends StatefulWidget {
  const CustomerPortfolioPage({super.key});

  @override
  State<CustomerPortfolioPage> createState() => _CustomerPortfolioPageState();
}

class _CustomerPortfolioPageState extends State<CustomerPortfolioPage> {
  final _repo = sl<PortfolioRepository>();
  List<PortfolioItemEntity> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await _repo.getPortfolio();
      setState(() => _items = items);
    } finally {
      setState(() => _loading = false);
    }
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
      title: 'Fashion House Portfolio',
      selectedIndex: 0,
      onNavigate: _navigate,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _items.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No portfolio items published yet')),
                      ],
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.72,
                      ),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final item = _items[index];
                        return _PortfolioGridTile(item: item);
                      },
                    ),
            ),
    );
  }
}

class _PortfolioGridTile extends StatelessWidget {
  const _PortfolioGridTile({required this.item});

  final PortfolioItemEntity item;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          showModalBottomSheet<void>(
            context: context,
            builder: (_) => Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                  if (item.category != null) Text(item.category!),
                  if (item.fabric != null) Text('Fabric: ${item.fabric}'),
                  if (item.description != null) ...[
                    const SizedBox(height: 12),
                    Text(item.description!),
                  ],
                ],
              ),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: item.photoUrls.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: item.photoUrls.first,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    )
                  : Container(
                      color: AppTheme.primary.withValues(alpha: 0.08),
                      child: const Center(child: Icon(Icons.checkroom_outlined)),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  if (item.styleName != null)
                    Text(item.styleName!, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
