import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class DesignerStylesPage extends StatefulWidget {
  const DesignerStylesPage({super.key});

  @override
  State<DesignerStylesPage> createState() => _DesignerStylesPageState();
}

class _DesignerStylesPageState extends State<DesignerStylesPage> {
  final _repo = sl<StylesRepository>();
  final _uploads = sl<UploadsRepository>();
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
      final items = await _repo.getStyles();
      setState(() => _styles = items);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _showAddSheet() async {
    final nameController = TextEditingController();
    final categoryController = TextEditingController(text: 'Agbada');
    final descController = TextEditingController();
    final priceController = TextEditingController();
    final photoUrls = <String>[];
    final videoUrls = <String>[];

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Add style', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                    TextField(controller: categoryController, decoration: const InputDecoration(labelText: 'Category')),
                    TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
                    TextField(controller: priceController, decoration: const InputDecoration(labelText: 'Base price (₦)'), keyboardType: TextInputType.number),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
                        if (file == null) return;
                        final url = await _uploads.uploadImage(file.path);
                        setSheetState(() => photoUrls.add(url));
                      },
                      icon: const Icon(Icons.photo_outlined),
                      label: Text('Add photo (${photoUrls.length})'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final file = await ImagePicker().pickVideo(source: ImageSource.gallery);
                        if (file == null) return;
                        final url = await _uploads.uploadImage(file.path);
                        setSheetState(() => videoUrls.add(url));
                      },
                      icon: const Icon(Icons.videocam_outlined),
                      label: Text('Add video (${videoUrls.length})'),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () async {
                        await _repo.createStyle({
                          'name': nameController.text.trim(),
                          'category': categoryController.text.trim(),
                          if (descController.text.trim().isNotEmpty) 'description': descController.text.trim(),
                          if (priceController.text.trim().isNotEmpty) 'basePrice': double.tryParse(priceController.text.trim()),
                          'photoUrls': photoUrls,
                          'videoUrls': videoUrls,
                          'isActive': true,
                        });
                        if (context.mounted) Navigator.pop(context);
                        await _load();
                      },
                      child: const Text('Save style'),
                    ),
                  ],
                ),
              ),
            );
          },
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
      title: 'Styles',
      selectedIndex: 2,
      onNavigate: _navigate,
      unreadMessages: 0,
      actions: [
        IconButton(onPressed: _showAddSheet, icon: const Icon(Icons.add)),
      ],
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _styles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('No styles yet'),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _showAddSheet, child: const Text('Add style')),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  itemCount: _styles.length,
                  itemBuilder: (context, index) {
                    final style = _styles[index];
                    return Card(
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
                                  Text(formatNgn(style.basePrice!), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                Row(
                                  children: [
                                    TextButton(
                                      onPressed: () async {
                                        await _repo.updateStyle(style.id, {'isActive': !style.isActive});
                                        await _load();
                                      },
                                      child: Text(style.isActive ? 'Hide' : 'Show'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
