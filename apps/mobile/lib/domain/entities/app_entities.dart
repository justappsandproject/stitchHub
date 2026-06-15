import 'package:equatable/equatable.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';

class OrderEntity extends Equatable {
  const OrderEntity({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.customerName,
    required this.totalAmount,
    required this.createdAt,
    this.fabric,
    this.deliveryDate,
    this.priority,
    this.balanceAmount,
  });

  final String id;
  final String orderNumber;
  final OrderStatus status;
  final String customerName;
  final double totalAmount;
  final DateTime createdAt;
  final String? fabric;
  final DateTime? deliveryDate;
  final String? priority;
  final double? balanceAmount;

  @override
  List<Object?> get props => [id, orderNumber, status, customerName];
}

class CustomerEntity extends Equatable {
  const CustomerEntity({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.email,
    this.isVip = false,
    this.photoUrl,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String phone;
  final String? email;
  final bool isVip;
  final String? photoUrl;

  String get fullName => '$firstName $lastName'.trim();

  @override
  List<Object?> get props => [id, firstName, lastName, phone];
}

class MessageEntity extends Equatable {
  const MessageEntity({
    required this.id,
    required this.body,
    required this.createdAt,
    required this.senderName,
    required this.senderRole,
    this.readAt,
  });

  final String id;
  final String body;
  final DateTime createdAt;
  final String senderName;
  final UserRole senderRole;
  final DateTime? readAt;

  bool get isUnread => readAt == null;

  @override
  List<Object?> get props => [id, body, createdAt];
}

class DashboardSummary extends Equatable {
  const DashboardSummary({
    required this.title,
    required this.stats,
    this.recentOrders = const [],
    this.recentPortfolio = const [],
    this.ordersByStatus = const [],
    this.portfolioCount,
    this.activeDiscounts,
  });

  final String title;
  final List<DashboardStat> stats;
  final List<OrderEntity> recentOrders;
  final List<PortfolioItemEntity> recentPortfolio;
  final List<OrderStatusCount> ordersByStatus;
  final int? portfolioCount;
  final int? activeDiscounts;

  @override
  List<Object?> get props => [title, stats, recentOrders, recentPortfolio];
}

class OrderStatusCount extends Equatable {
  const OrderStatusCount({required this.status, required this.count});

  final String status;
  final int count;

  @override
  List<Object?> get props => [status, count];
}

class PortfolioItemEntity extends Equatable {
  const PortfolioItemEntity({
    required this.id,
    required this.title,
    this.description,
    this.category,
    this.fabric,
    this.styleName,
    this.photoUrls = const [],
    this.isFeatured = false,
    this.isPublished = true,
    this.source,
    this.completedAt,
  });

  final String id;
  final String title;
  final String? description;
  final String? category;
  final String? fabric;
  final String? styleName;
  final List<String> photoUrls;
  final bool isFeatured;
  final bool isPublished;
  final String? source;
  final DateTime? completedAt;

  @override
  List<Object?> get props => [id, title];
}

class DiscountEntity extends Equatable {
  const DiscountEntity({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
    required this.value,
    this.description,
    this.applicability,
    this.minOrderAmount,
    this.maxDiscountCap,
    this.maxUses,
    this.usedCount = 0,
    this.isActive = true,
    this.validUntil,
  });

  final String id;
  final String code;
  final String name;
  final String type;
  final double value;
  final String? description;
  final String? applicability;
  final double? minOrderAmount;
  final double? maxDiscountCap;
  final int? maxUses;
  final int usedCount;
  final bool isActive;
  final DateTime? validUntil;

  @override
  List<Object?> get props => [id, code];
}

class DiscountValidationResult extends Equatable {
  const DiscountValidationResult({
    required this.valid,
    required this.discountAmount,
    required this.subtotalAmount,
    required this.totalAmount,
    this.code,
    this.name,
    this.message,
  });

  final bool valid;
  final double discountAmount;
  final double subtotalAmount;
  final double totalAmount;
  final String? code;
  final String? name;
  final String? message;

  @override
  List<Object?> get props => [valid, totalAmount];
}

class DashboardStat extends Equatable {
  const DashboardStat({
    required this.label,
    required this.value,
    this.isCurrency = false,
  });

  final String label;
  final num value;
  final bool isCurrency;

  @override
  List<Object?> get props => [label, value];
}

class SubscriptionEntity extends Equatable {
  const SubscriptionEntity({
    required this.plan,
    required this.status,
    required this.isSuspended,
    required this.requiresPayment,
  });

  final SubscriptionPlan plan;
  final String status;
  final bool isSuspended;
  final bool requiresPayment;

  @override
  List<Object?> get props => [plan, status, isSuspended];
}

class AdminTenantEntity extends Equatable {
  const AdminTenantEntity({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
    this.plan,
    this.subscriptionStatus,
  });

  final String id;
  final String name;
  final String slug;
  final bool isActive;
  final String? plan;
  final String? subscriptionStatus;

  @override
  List<Object?> get props => [id, name, slug, isActive];
}

class MeasurementTemplateEntity extends Equatable {
  const MeasurementTemplateEntity({
    required this.id,
    required this.name,
    required this.category,
    required this.fields,
  });

  final String id;
  final String name;
  final String category;
  final List<MeasurementFieldEntity> fields;

  @override
  List<Object?> get props => [id, name];
}

class MeasurementFieldEntity extends Equatable {
  const MeasurementFieldEntity({
    required this.key,
    required this.label,
    required this.unit,
  });

  final String key;
  final String label;
  final String unit;

  @override
  List<Object?> get props => [key, label];
}

class MeasurementEntity extends Equatable {
  const MeasurementEntity({
    required this.id,
    required this.version,
    required this.values,
    required this.templateName,
    required this.fields,
    required this.createdAt,
    this.notes,
    this.templateId,
    this.customerId,
  });

  final String id;
  final int version;
  final Map<String, dynamic> values;
  final String templateName;
  final List<MeasurementFieldEntity> fields;
  final DateTime createdAt;
  final String? notes;
  final String? templateId;
  final String? customerId;

  @override
  List<Object?> get props => [id, version];
}
