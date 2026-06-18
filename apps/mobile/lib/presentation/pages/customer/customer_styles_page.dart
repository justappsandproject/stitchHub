import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';
import 'package:stitchhub_mobile/presentation/widgets/empty_state.dart';

class CustomerStylesPage extends StatefulWidget {
  const CustomerStylesPage({super.key});

  @override
  State<CustomerStylesPage> createState() => _CustomerStylesPageState();
}

class _CustomerStylesPageState extends State<CustomerStylesPage> {
  List<StyleEntity> _styles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await sl<StylesRepository>().getStyles();
      setState(() => _styles = items.where((s) => s.isActive).toList());
    } finally {
      setState(() => _loading = false);
    }
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
      title: 'Lookbook',
      selectedIndex: 1,
      onNavigate: _navigate,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _styles.isEmpty
              ? const EmptyState(
                  title: 'Lookbook coming soon',
                  message: 'Your fashion house has not published styles yet. Check back soon!',
                  icon: Icons.auto_awesome_outlined,
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.68,
                  ),
                  itemCount: _styles.length,
                  itemBuilder: (context, index) {
                    final style = _styles[index];
                    return GestureDetector(
                      onTap: () => context.push('${AppRouter.customerStyles}/${style.id}'),
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: style.photoUrls.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: style.photoUrls.first,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                    )
                                  : Container(
                                      color: AppTheme.primary.withValues(alpha: 0.08),
                                      child: const Center(child: Icon(Icons.checkroom_outlined)),
                                    ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(style.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text(style.category, style: Theme.of(context).textTheme.bodySmall),
                                  if (style.basePrice != null)
                                    Text('From ${formatNgn(style.basePrice!)}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
