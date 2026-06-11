/// StitchHub domain enums — mirrors @stitchhub/shared
library;

enum UserRole {
  superAdmin('SUPER_ADMIN'),
  tenantOwner('TENANT_OWNER'),
  manager('MANAGER'),
  tailor('TAILOR'),
  cutter('CUTTER'),
  finisher('FINISHER'),
  apprentice('APPRENTICE'),
  customer('CUSTOMER');

  const UserRole(this.value);
  final String value;

  static UserRole fromString(String value) =>
      UserRole.values.firstWhere((r) => r.value == value, orElse: () => customer);
}

enum OrderStatus {
  newOrder('NEW'),
  measured('MEASURED'),
  cutting('CUTTING'),
  sewing('SEWING'),
  fitting('FITTING'),
  finishing('FINISHING'),
  ready('READY'),
  delivered('DELIVERED'),
  cancelled('CANCELLED');

  const OrderStatus(this.value);
  final String value;

  static OrderStatus fromString(String value) =>
      OrderStatus.values.firstWhere((r) => r.value == value, orElse: () => newOrder);
}

enum SubscriptionPlan {
  starter('STARTER'),
  professional('PROFESSIONAL'),
  enterprise('ENTERPRISE');

  const SubscriptionPlan(this.value);
  final String value;

  static SubscriptionPlan fromString(String value) => SubscriptionPlan.values
      .firstWhere((p) => p.value == value, orElse: () => starter);
}

enum PaymentMethod {
  cash('CASH'),
  bankTransfer('BANK_TRANSFER'),
  paystack('PAYSTACK'),
  flutterwave('FLUTTERWAVE');

  const PaymentMethod(this.value);
  final String value;
}

const staffRoles = [
  UserRole.tenantOwner,
  UserRole.manager,
  UserRole.tailor,
  UserRole.cutter,
  UserRole.finisher,
  UserRole.apprentice,
];

const orderStatusProgress = {
  OrderStatus.newOrder: 0,
  OrderStatus.measured: 10,
  OrderStatus.cutting: 25,
  OrderStatus.sewing: 45,
  OrderStatus.fitting: 65,
  OrderStatus.finishing: 80,
  OrderStatus.ready: 95,
  OrderStatus.delivered: 100,
  OrderStatus.cancelled: 0,
};
