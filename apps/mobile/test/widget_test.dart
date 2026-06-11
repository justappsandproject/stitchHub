import 'package:flutter_test/flutter_test.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';

void main() {
  test('role helpers identify super admin', () {
    expect(isSuperAdmin(UserRole.superAdmin), isTrue);
    expect(isStaff(UserRole.tailor), isTrue);
    expect(isCustomer(UserRole.customer), isTrue);
  });
}
