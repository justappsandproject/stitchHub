import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/widgets/app_shell.dart';

class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});

  @override
  State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  final _searchController = TextEditingController();
  List<CustomerEntity> _customers = [];
  bool _loading = true;
  String? _error;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  String? _photoUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomers([String? query]) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final customers = await sl<CustomersRepository>().getCustomers(
        query: query?.trim().isEmpty == true ? null : query?.trim(),
      );
      setState(() => _customers = customers);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    final url = await sl<UploadsRepository>().uploadImage(file.path);
    setState(() => _photoUrl = url);
  }

  Future<void> _createCustomer() async {
    setState(() => _saving = true);
    try {
      await sl<CustomersRepository>().createCustomer({
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        if (_emailController.text.trim().isNotEmpty) 'email': _emailController.text.trim(),
        if (_photoUrl != null) 'photoUrl': _photoUrl,
      });
      if (!mounted) return;
      Navigator.pop(context);
      _firstNameController.clear();
      _lastNameController.clear();
      _phoneController.clear();
      _emailController.clear();
      _photoUrl = null;
      await _loadCustomers(_searchController.text);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _saving = false);
    }
  }

  void _showCreateDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Add customer', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextButton(onPressed: _pickPhoto, child: Text(_photoUrl == null ? 'Upload photo' : 'Photo selected')),
            TextField(controller: _firstNameController, decoration: const InputDecoration(labelText: 'First name')),
            TextField(controller: _lastNameController, decoration: const InputDecoration(labelText: 'Last name')),
            TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone')),
            TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _createCustomer,
              child: Text(_saving ? 'Saving...' : 'Create customer'),
            ),
          ],
        ),
      ),
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
      title: 'Customers',
      selectedIndex: 2,
      onNavigate: _navigate,
      unreadMessages: 0,
      actions: [
        IconButton(
          onPressed: () => context.push(AppRouter.designerStyles),
          icon: const Icon(Icons.palette_outlined),
        ),
        IconButton(onPressed: _showCreateDialog, icon: const Icon(Icons.person_add_outlined)),
      ],
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search customers...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _loadCustomers();
                  },
                ),
              ),
              onSubmitted: _loadCustomers,
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _customers.isEmpty
                    ? const Center(child: Text('No customers found'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _customers.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final customer = _customers[index];
                          return Card(
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundImage: customer.photoUrl != null
                                    ? CachedNetworkImageProvider(customer.photoUrl!)
                                    : null,
                                child: customer.photoUrl == null
                                    ? Text(customer.firstName.isNotEmpty ? customer.firstName[0] : '?')
                                    : null,
                              ),
                              title: Text(customer.fullName),
                              subtitle: Text('${customer.phone}${customer.email != null ? '\n${customer.email}' : ''}'),
                              trailing: customer.isVip ? const Chip(label: Text('VIP')) : null,
                              onTap: () => context.push('${AppRouter.designerCustomerDetail}/${customer.id}'),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
