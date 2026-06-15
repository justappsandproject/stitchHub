import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerPortfolioPage extends StatefulWidget {
  const DesignerPortfolioPage({super.key});

  @override
  State<DesignerPortfolioPage> createState() => _DesignerPortfolioPageState();
}

class _DesignerPortfolioPageState extends State<DesignerPortfolioPage> {
  final _repo = sl<PortfolioRepository>();
  final _uploads = sl<UploadsRepository>();
  List<PortfolioItemEntity> _items = [];
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
      final items = await _repo.getPortfolio();
      setState(() => _items = items);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _showAddSheet() async {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final categoryController = TextEditingController(text: 'Agbada');
    final fabricController = TextEditingController();
    String? photoUrl;

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
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Add portfolio work',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'Title'),
                  ),
                  TextField(
                    controller: categoryController,
                    decoration: const InputDecoration(labelText: 'Category'),
                  ),
                  TextField(
                    controller: fabricController,
                    decoration: const InputDecoration(labelText: 'Fabric'),
                  ),
                  TextField(
                    controller: descController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final file = await ImagePicker().pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 85,
                      );
                      if (file == null) return;
                      final url = await _uploads.uploadImage(file.path);
                      setSheetState(() => photoUrl = url);
                    },
                    icon: const Icon(Icons.photo_outlined),
                    label: Text(photoUrl == null ? 'Add photo' : 'Photo added'),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () async {
                      if (titleController.text.trim().isEmpty) return;
                      await _repo.createPortfolioItem({
                        'title': titleController.text.trim(),
                        'category': categoryController.text.trim(),
                        'fabric': fabricController.text.trim(),
                        'description': descController.text.trim(),
                        if (photoUrl != null) 'photoUrls': [photoUrl],
                        'isPublished': true,
                      });
                      if (context.mounted) Navigator.pop(context);
                      await _load();
                    },
                    child: const Text('Save to portfolio'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
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
      title: 'Portfolio',
      selectedIndex: 0,
      onNavigate: _navigate,
      unreadMessages: 0,
      actions: [
        IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
      ],
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    color: AppTheme.primary.withValues(alpha: 0.06),
                    child: const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'Completed orders are added automatically when marked delivered. You can also add showcase pieces manually.',
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _showAddSheet,
                    icon: const Icon(Icons.add),
                    label: const Text('Add portfolio work'),
                  ),
                  const SizedBox(height: 12),
                  if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  if (_items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: Text('No portfolio items yet')),
                    )
                  else
                    ..._items.map(
                      (item) => Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (item.photoUrls.isNotEmpty)
                              CachedNetworkImage(
                                imageUrl: item.photoUrls.first,
                                height: 180,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.title,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ),
                                      if (item.isFeatured)
                                        const Chip(label: Text('Featured'), visualDensity: VisualDensity.compact),
                                    ],
                                  ),
                                  if (item.category != null)
                                    Text(item.category!, style: Theme.of(context).textTheme.bodySmall),
                                  if (item.description != null) ...[
                                    const SizedBox(height: 8),
                                    Text(item.description!),
                                  ],
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    children: [
                                      Chip(
                                        label: Text(item.source == 'ORDER' ? 'From order' : 'Manual'),
                                        visualDensity: VisualDensity.compact,
                                      ),
                                      if (item.fabric != null)
                                        Chip(label: Text(item.fabric!), visualDensity: VisualDensity.compact),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
