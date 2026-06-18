import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/notifications/push_notification_service.dart';
import 'package:stitchhub_mobile/core/router/app_router.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _savingProfile = false;
  bool _savingPassword = false;
  String? _profileMessage;
  String? _passwordMessage;
  String? _error;
  String? _photoUrl;
  SubscriptionEntity? _subscription;
  bool _loadingPlan = false;

  @override
  void initState() {
    super.initState();
    _loadPlanIfStaff();
  }

  Future<void> _loadPlanIfStaff() async {
    final authState = sl<AuthBloc>().state;
    if (authState is! AuthAuthenticated || !isStaff(authState.user.role)) return;
    setState(() => _loadingPlan = true);
    try {
      final sub = await sl<SubscriptionRepository>().getCurrent();
      if (mounted) setState(() => _subscription = sub);
    } catch (_) {
      // Plan info is optional in settings.
    } finally {
      if (mounted) setState(() => _loadingPlan = false);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadUser(UserEntity user) {
    _firstNameController.text = user.firstName;
    _lastNameController.text = user.lastName;
    _phoneController.text = user.phone ?? '';
    _emailController.text = user.email;
    _photoUrl = user.photoUrl;
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;

    setState(() => _savingProfile = true);
    try {
      final url = await sl<UploadsRepository>().uploadImage(file.path);
      setState(() => _photoUrl = url);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _savingProfile = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() {
      _savingProfile = true;
      _error = null;
      _profileMessage = null;
    });

    try {
      final user = await sl<AuthRepository>().updateProfile({
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        if (_photoUrl != null) 'photoUrl': _photoUrl,
      });
      if (!mounted) return;
      context.read<AuthBloc>().add(AuthProfileUpdated(user));
      setState(() => _profileMessage = 'Profile updated');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _savingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'New passwords do not match');
      return;
    }

    setState(() {
      _savingPassword = true;
      _error = null;
      _passwordMessage = null;
    });

    try {
      await sl<AuthRepository>().changePassword(
        _currentPasswordController.text,
        _newPasswordController.text,
      );
      setState(() {
        _passwordMessage = 'Password updated';
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _savingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        if (user != null &&
            _firstNameController.text.isEmpty &&
            _emailController.text.isEmpty) {
          _loadUser(user);
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Settings')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 16),
                      Center(
                        child: GestureDetector(
                          onTap: _pickPhoto,
                          child: CircleAvatar(
                            radius: 40,
                            backgroundImage: _photoUrl != null
                                ? CachedNetworkImageProvider(_photoUrl!)
                                : null,
                            child: _photoUrl == null
                                ? Text(user?.firstName.isNotEmpty == true ? user!.firstName[0] : '?')
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Center(child: TextButton(onPressed: _pickPhoto, child: const Text('Change photo'))),
                      TextField(controller: _firstNameController, decoration: const InputDecoration(labelText: 'First name')),
                      const SizedBox(height: 12),
                      TextField(controller: _lastNameController, decoration: const InputDecoration(labelText: 'Last name')),
                      const SizedBox(height: 12),
                      TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone')),
                      const SizedBox(height: 12),
                      TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email')),
                      if (_profileMessage != null) ...[
                        const SizedBox(height: 8),
                        Text(_profileMessage!, style: const TextStyle(color: Colors.green)),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _savingProfile ? null : _saveProfile,
                        child: Text(_savingProfile ? 'Saving...' : 'Save profile'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Change password', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 16),
                      TextField(controller: _currentPasswordController, obscureText: true, decoration: const InputDecoration(labelText: 'Current password')),
                      const SizedBox(height: 12),
                      TextField(controller: _newPasswordController, obscureText: true, decoration: const InputDecoration(labelText: 'New password')),
                      const SizedBox(height: 12),
                      TextField(controller: _confirmPasswordController, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm password')),
                      if (_passwordMessage != null) ...[
                        const SizedBox(height: 8),
                        Text(_passwordMessage!, style: const TextStyle(color: Colors.green)),
                      ],
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _savingPassword ? null : _changePassword,
                        child: Text(_savingPassword ? 'Saving...' : 'Update password'),
                      ),
                    ],
                  ),
                ),
              ),
              if (user != null && isStaff(user.role)) ...[
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Subscription',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Your atelier subscription and usage',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 16),
                        if (_loadingPlan)
                          const Center(child: CircularProgressIndicator())
                        else if (_subscription != null) ...[
                          Text(
                            '${_subscription!.configName ?? _subscription!.plan.value} plan',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
                          ),
                          const SizedBox(height: 4),
                          Text('Status: ${_subscription!.status.replaceAll('_', ' ')}'),
                          if (_subscription!.priceNgn != null)
                            Text('${formatNgn(_subscription!.priceNgn!)}/month'),
                          if (_subscription!.usageCustomers != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              'Customers: ${_subscription!.usageCustomers}${_subscription!.maxCustomers != null ? ' / ${_subscription!.maxCustomers}' : ''}',
                            ),
                          ],
                          if (_subscription!.usageOrdersThisMonth != null)
                            Text(
                              'Orders this month: ${_subscription!.usageOrdersThisMonth}${_subscription!.maxOrdersPerMonth != null ? ' / ${_subscription!.maxOrdersPerMonth}' : ''}',
                            ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () => context.push(AppRouter.planDetail),
                            child: const Text('View plan details'),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: () => context.go(AppRouter.designerBilling),
                            child: const Text('Manage billing'),
                          ),
                        ] else
                          const Text('Unable to load plan details'),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Push notifications'),
                subtitle: Text(
                  sl<PushNotificationService>().cachedToken != null
                      ? 'Device registered with Firebase'
                      : 'Not registered yet',
                ),
              ),
              ListTile(
                leading: const Icon(Icons.sync),
                title: const Text('Offline sync'),
                subtitle: const Text('Changes queue automatically when offline'),
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Sign out'),
                onTap: () {
                  context.read<AuthBloc>().add(const AuthLogoutRequested());
                  context.go(AppRouter.login);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
