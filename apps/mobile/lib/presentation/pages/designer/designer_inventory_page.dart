import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';
import 'package:stitchhub_mobile/presentation/widgets/empty_state.dart';
import 'package:stitchhub_mobile/presentation/widgets/stat_card.dart';

class DesignerInventoryPage extends StatefulWidget {
  const DesignerInventoryPage({super.key});

  @override
  State<DesignerInventoryPage> createState() => _DesignerInventoryPageState();
}

class _DesignerInventoryPageState extends State<DesignerInventoryPage> {
  final _repo = sl<InventoryRepository>();
  final _uploads = sl<UploadsRepository>();
  final _searchController = TextEditingController();

  Map<String, dynamic>? _dashboard;
  List<Map<String, dynamic>> _products = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load([String? query]) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _repo.getDashboard(),
        _repo.listProducts(query: query?.trim().isEmpty == true ? null : query?.trim()),
      ]);
      setState(() {
        _dashboard = results[0] as Map<String, dynamic>;
        _products = results[1] as List<Map<String, dynamic>>;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
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

  Future<void> _showProductSheet({Map<String, dynamic>? product}) async {
    final isEdit = product != null;
    final nameController = TextEditingController(text: product?['name'] as String? ?? '');
    final categoryController = TextEditingController(text: product?['category'] as String? ?? '');
    final descController = TextEditingController(text: product?['description'] as String? ?? '');
    final skuController = TextEditingController(text: product?['sku'] as String? ?? '');
    final costController = TextEditingController(
      text: product?['unitCost'] != null ? '${parseNumOrZero(product!['unitCost'])}' : '',
    );
    final priceController = TextEditingController(
      text: product?['unitPrice'] != null ? '${parseNumOrZero(product!['unitPrice'])}' : '',
    );
    final qtyController = TextEditingController(
      text: product?['quantity'] != null ? '${parseIntOrZero(product!['quantity'])}' : '0',
    );
    final thresholdController = TextEditingController(
      text: product?['lowStockThreshold'] != null
          ? '${parseIntOrZero(product!['lowStockThreshold'])}'
          : '5',
    );
    final supplierController = TextEditingController(text: product?['supplier'] as String? ?? '');
    final photoUrls = List<String>.from(
      (product?['photoUrls'] as List<dynamic>? ?? []).map((e) => e.toString()),
    );
    var saving = false;

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
                    Text(
                      isEdit ? 'Edit product' : 'Add product',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name *')),
                    TextField(controller: categoryController, decoration: const InputDecoration(labelText: 'Category')),
                    TextField(controller: descController, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
                    TextField(controller: skuController, decoration: const InputDecoration(labelText: 'SKU')),
                    TextField(controller: costController, decoration: const InputDecoration(labelText: 'Unit cost (₦)'), keyboardType: TextInputType.number),
                    TextField(controller: priceController, decoration: const InputDecoration(labelText: 'Unit price (₦)'), keyboardType: TextInputType.number),
                    if (!isEdit)
                      TextField(controller: qtyController, decoration: const InputDecoration(labelText: 'Initial quantity'), keyboardType: TextInputType.number),
                    TextField(controller: thresholdController, decoration: const InputDecoration(labelText: 'Low stock threshold'), keyboardType: TextInputType.number),
                    TextField(controller: supplierController, decoration: const InputDecoration(labelText: 'Supplier')),
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
                    if (photoUrls.isNotEmpty)
                      SizedBox(
                        height: 72,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: photoUrls.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) => Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: CachedNetworkImage(imageUrl: photoUrls[i], width: 72, height: 72, fit: BoxFit.cover),
                              ),
                              Positioned(
                                top: 0,
                                right: 0,
                                child: IconButton(
                                  icon: const Icon(Icons.close, size: 16),
                                  onPressed: () => setSheetState(() => photoUrls.removeAt(i)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: saving
                          ? null
                          : () async {
                              setSheetState(() => saving = true);
                              try {
                                final payload = <String, dynamic>{
                                  'name': nameController.text.trim(),
                                  if (categoryController.text.trim().isNotEmpty)
                                    'category': categoryController.text.trim(),
                                  if (descController.text.trim().isNotEmpty)
                                    'description': descController.text.trim(),
                                  if (skuController.text.trim().isNotEmpty) 'sku': skuController.text.trim(),
                                  if (costController.text.trim().isNotEmpty)
                                    'unitCost': double.tryParse(costController.text.trim()),
                                  if (priceController.text.trim().isNotEmpty)
                                    'unitPrice': double.tryParse(priceController.text.trim()),
                                  if (!isEdit && qtyController.text.trim().isNotEmpty)
                                    'quantity': int.tryParse(qtyController.text.trim()) ?? 0,
                                  if (thresholdController.text.trim().isNotEmpty)
                                    'lowStockThreshold': int.tryParse(thresholdController.text.trim()) ?? 5,
                                  if (supplierController.text.trim().isNotEmpty)
                                    'supplier': supplierController.text.trim(),
                                  'photoUrls': photoUrls,
                                };
                                if (isEdit) {
                                  await _repo.updateProduct(product['id'] as String, payload);
                                } else {
                                  await _repo.createProduct(payload);
                                }
                                if (context.mounted) Navigator.pop(context);
                                await _load(_searchController.text);
                              } on ApiException catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(e.message)),
                                  );
                                }
                              } finally {
                                if (context.mounted) setSheetState(() => saving = false);
                              }
                            },
                      child: Text(saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Add product')),
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

  Future<void> _showRestockSheet(Map<String, dynamic> product) async {
    final qtyController = TextEditingController(text: '1');
    final costController = TextEditingController(
      text: product['unitCost'] != null ? '${parseNumOrZero(product['unitCost'])}' : '',
    );
    final notesController = TextEditingController();
    var saving = false;

    await showModalBottomSheet<void>(
      context: context,
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Restock ${product['name']}', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(
                    controller: qtyController,
                    decoration: const InputDecoration(labelText: 'Quantity *'),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: costController,
                    decoration: const InputDecoration(labelText: 'Unit cost (₦)'),
                    keyboardType: TextInputType.number,
                  ),
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(labelText: 'Notes'),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: saving
                        ? null
                        : () async {
                            setSheetState(() => saving = true);
                            try {
                              await _repo.restockProduct(product['id'] as String, {
                                'quantity': int.tryParse(qtyController.text.trim()) ?? 1,
                                if (costController.text.trim().isNotEmpty)
                                  'unitCost': double.tryParse(costController.text.trim()),
                                if (notesController.text.trim().isNotEmpty)
                                  'notes': notesController.text.trim(),
                              });
                              if (context.mounted) Navigator.pop(context);
                              await _load(_searchController.text);
                            } on ApiException catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(e.message)),
                                );
                              }
                            } finally {
                              if (context.mounted) setSheetState(() => saving = false);
                            }
                          },
                    child: Text(saving ? 'Saving...' : 'Restock'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> product) async {
    final name = product['name'] as String? ?? 'this product';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete product?'),
        content: Text('This will remove $name from inventory.'),
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
    if (confirmed != true) return;

    try {
      await _repo.deleteProduct(product['id'] as String);
      await _load(_searchController.text);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product deleted')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DesignerShell(
      title: 'Inventory',
      selectedIndex: 0,
      onNavigate: _navigate,
      unreadMessages: 0,
      actions: [
        IconButton(onPressed: () => _showProductSheet(), icon: const Icon(Icons.add)),
      ],
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _load(_searchController.text),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    ),
                  if (_dashboard != null) ...[
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.35,
                      children: [
                        StatCard(
                          label: 'Products',
                          value: '${parseIntOrZero(_dashboard!['totalProducts'])}',
                          icon: Icons.inventory_2_outlined,
                        ),
                        StatCard(
                          label: 'In stock',
                          value: '${parseIntOrZero(_dashboard!['availableStock'])}',
                          icon: Icons.warehouse_outlined,
                        ),
                        StatCard(
                          label: 'Low stock',
                          value: '${parseIntOrZero(_dashboard!['lowStock'])}',
                          icon: Icons.warning_amber_outlined,
                        ),
                        StatCard(
                          label: 'Inventory value',
                          value: formatNgn(parseNumOrZero(_dashboard!['totalInventoryValue'])),
                          icon: Icons.payments_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search products...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _load();
                        },
                      ),
                    ),
                    onSubmitted: _load,
                  ),
                  const SizedBox(height: 16),
                  if (_products.isEmpty)
                    EmptyState(
                      title: 'No products yet',
                      message: 'Track fabrics, trims, and supplies in one place.',
                      icon: Icons.inventory_2_outlined,
                      actionLabel: 'Add product',
                      onAction: () => _showProductSheet(),
                    )
                  else
                    ..._products.map((product) {
                      final qty = parseIntOrZero(product['quantity']);
                      final threshold = parseIntOrZero(product['lowStockThreshold']);
                      final isLow = qty > 0 && qty <= threshold;
                      final isOut = qty <= 0;
                      final photos = product['photoUrls'] as List<dynamic>? ?? [];

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: photos.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: photos.first.toString(),
                                    width: 48,
                                    height: 48,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : CircleAvatar(
                                  backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                                  child: const Icon(Icons.inventory_2_outlined, size: 20),
                                ),
                          title: Text(
                            product['name'] as String? ?? '',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: Text(
                            '${product['category'] ?? 'Uncategorized'} · Qty $qty'
                            '${isOut ? ' · Out of stock' : isLow ? ' · Low stock' : ''}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) {
                              switch (value) {
                                case 'edit':
                                  _showProductSheet(product: product);
                                case 'restock':
                                  _showRestockSheet(product);
                                case 'delete':
                                  _confirmDelete(product);
                              }
                            },
                            itemBuilder: (_) => const [
                              PopupMenuItem(value: 'edit', child: Text('Edit')),
                              PopupMenuItem(value: 'restock', child: Text('Restock')),
                              PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
                          onTap: () => _showProductSheet(product: product),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
