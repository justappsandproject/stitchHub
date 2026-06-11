import 'package:stitchhub_mobile/core/constants/enums.dart';

bool isSuperAdmin(UserRole role) => role == UserRole.superAdmin;

bool isStaff(UserRole role) => staffRoles.contains(role);

bool isCustomer(UserRole role) => role == UserRole.customer;

bool isTenantOwner(UserRole role) => role == UserRole.tenantOwner;

String roleLabel(UserRole role) => switch (role) {
      UserRole.superAdmin => 'Platform Admin',
      UserRole.tenantOwner => 'Fashion House Owner',
      UserRole.manager => 'Manager',
      UserRole.tailor => 'Fashion Designer',
      UserRole.cutter => 'Cutter',
      UserRole.finisher => 'Finisher',
      UserRole.apprentice => 'Apprentice',
      UserRole.customer => 'Customer',
    };

String formatNgn(num amount) => '₦${amount.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    )}';
