import 'dart:convert';

import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/utils/json_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.email,
    required super.role,
    required super.firstName,
    required super.lastName,
    super.tenantId,
    super.fashionHouseName,
    super.customerId,
    super.phone,
    super.photoUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        email: json['email'] as String,
        role: UserRole.fromString(json['role'] as String),
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        tenantId: json['tenantId'] as String?,
        fashionHouseName: json['fashionHouseName'] as String?,
        customerId: json['customerId'] as String? ??
            (json['customer'] as Map<String, dynamic>?)?['id'] as String?,
        phone: json['phone'] as String?,
        photoUrl: json['photoUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role.value,
        'firstName': firstName,
        'lastName': lastName,
        'tenantId': tenantId,
        'fashionHouseName': fashionHouseName,
        'phone': phone,
        'photoUrl': photoUrl,
      };

  String toJsonString() => jsonEncode(toJson());
}

class OrderModel extends OrderEntity {
  const OrderModel({
    required super.id,
    required super.orderNumber,
    required super.status,
    required super.customerName,
    required super.totalAmount,
    required super.createdAt,
    super.fabric,
    super.deliveryDate,
    super.priority,
    super.balanceAmount,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>?;
    final customerName = customer != null
        ? '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'.trim()
        : 'Customer';

    return OrderModel(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String? ?? '',
      status: OrderStatus.fromString(json['status'] as String? ?? 'NEW'),
      customerName: customerName,
      totalAmount: parseDoubleOrZero(json['totalAmount']),
      createdAt: DateTime.parse(json['createdAt'] as String),
      fabric: json['fabric'] as String?,
      deliveryDate: json['deliveryDate'] != null
          ? DateTime.tryParse(json['deliveryDate'] as String)
          : null,
      priority: json['priority'] as String?,
      balanceAmount: parseDouble(json['balanceAmount']),
    );
  }
}

class CustomerModel extends CustomerEntity {
  const CustomerModel({
    required super.id,
    required super.firstName,
    required super.lastName,
    required super.phone,
    super.email,
    super.isVip,
    super.photoUrl,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) => CustomerModel(
        id: json['id'] as String,
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String?,
        isVip: json['isVip'] as bool? ?? false,
        photoUrl: json['photoUrl'] as String?,
      );
}

class MessageModel extends MessageEntity {
  const MessageModel({
    required super.id,
    required super.body,
    required super.createdAt,
    required super.senderName,
    required super.senderRole,
    super.readAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] as Map<String, dynamic>? ?? {};
    return MessageModel(
      id: json['id'] as String,
      body: json['body'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      senderName:
          '${sender['firstName'] ?? ''} ${sender['lastName'] ?? ''}'.trim(),
      senderRole: UserRole.fromString(sender['role'] as String? ?? 'CUSTOMER'),
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'] as String)
          : null,
    );
  }
}

class AdminTenantModel extends AdminTenantEntity {
  const AdminTenantModel({
    required super.id,
    required super.name,
    required super.slug,
    required super.isActive,
    super.plan,
    super.subscriptionStatus,
  });

  factory AdminTenantModel.fromJson(Map<String, dynamic> json) {
    final sub = json['subscription'] as Map<String, dynamic>?;
    return AdminTenantModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      plan: sub?['plan'] as String?,
      subscriptionStatus: sub?['status'] as String?,
    );
  }
}

class SubscriptionModel extends SubscriptionEntity {
  const SubscriptionModel({
    required super.plan,
    required super.status,
    required super.isSuspended,
    required super.requiresPayment,
    super.configName,
    super.priceNgn,
    super.maxCustomers,
    super.maxOrdersPerMonth,
    super.usageCustomers,
    super.usageOrdersThisMonth,
    super.usageMeasurements,
    super.currentPeriodEnd,
  });

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    final config = json['config'] as Map<String, dynamic>?;
    final usage = json['usage'] as Map<String, dynamic>?;
    return SubscriptionModel(
      plan: SubscriptionPlan.fromString(json['plan'] as String? ?? 'STARTER'),
      status: json['status'] as String? ?? 'TRIALING',
      isSuspended: json['isSuspended'] as bool? ?? false,
      requiresPayment: json['requiresPayment'] as bool? ?? false,
      configName: config?['name'] as String?,
      priceNgn: parseInt(config?['priceNgn']),
      maxCustomers: config?['maxCustomers'] as int?,
      maxOrdersPerMonth: config?['maxOrdersPerMonth'] as int?,
      usageCustomers: usage?['customers'] as int?,
      usageOrdersThisMonth: usage?['ordersThisMonth'] as int?,
      usageMeasurements: usage?['measurements'] as int?,
      currentPeriodEnd: json['currentPeriodEnd'] != null
          ? DateTime.tryParse(json['currentPeriodEnd'] as String)
          : null,
    );
  }
}

class MeasurementFieldModel extends MeasurementFieldEntity {
  const MeasurementFieldModel({
    required super.key,
    required super.label,
    required super.unit,
  });

  factory MeasurementFieldModel.fromJson(Map<String, dynamic> json) =>
      MeasurementFieldModel(
        key: json['key'] as String? ?? '',
        label: json['label'] as String? ?? '',
        unit: json['unit'] as String? ?? '',
      );
}

class MeasurementTemplateModel extends MeasurementTemplateEntity {
  const MeasurementTemplateModel({
    required super.id,
    required super.name,
    required super.category,
    required super.fields,
  });

  factory MeasurementTemplateModel.fromJson(Map<String, dynamic> json) {
    final rawFields = json['fields'] as List<dynamic>? ?? [];
    return MeasurementTemplateModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      category: json['category'] as String? ?? '',
      fields: rawFields
          .cast<Map<String, dynamic>>()
          .map(MeasurementFieldModel.fromJson)
          .toList(),
    );
  }
}

class MeasurementModel extends MeasurementEntity {
  const MeasurementModel({
    required super.id,
    required super.version,
    required super.values,
    required super.templateName,
    required super.fields,
    required super.createdAt,
    super.notes,
    super.templateId,
    super.customerId,
  });

  factory MeasurementModel.fromJson(Map<String, dynamic> json) {
    final template = json['template'] as Map<String, dynamic>? ?? {};
    final rawFields = template['fields'] as List<dynamic>? ?? [];
    return MeasurementModel(
      id: json['id'] as String,
      version: json['version'] as int? ?? 1,
      values: Map<String, dynamic>.from(json['values'] as Map? ?? {}),
      templateName: template['name'] as String? ?? 'Measurement',
      fields: rawFields
          .cast<Map<String, dynamic>>()
          .map(MeasurementFieldModel.fromJson)
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      notes: json['notes'] as String?,
      templateId: template['id'] as String? ?? json['templateId'] as String?,
      customerId: json['customerId'] as String?,
    );
  }
}

class PortfolioItemModel extends PortfolioItemEntity {
  const PortfolioItemModel({
    required super.id,
    required super.title,
    super.description,
    super.category,
    super.fabric,
    super.styleName,
    super.photoUrls,
    super.isFeatured,
    super.isPublished,
    super.source,
    super.completedAt,
  });

  factory PortfolioItemModel.fromJson(Map<String, dynamic> json) =>
      PortfolioItemModel(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        description: json['description'] as String?,
        category: json['category'] as String?,
        fabric: json['fabric'] as String?,
        styleName: json['styleName'] as String?,
        photoUrls: (json['photoUrls'] as List<dynamic>? ?? [])
            .map((e) => e.toString())
            .toList(),
        isFeatured: json['isFeatured'] as bool? ?? false,
        isPublished: json['isPublished'] as bool? ?? true,
        source: json['source'] as String?,
        completedAt: json['completedAt'] != null
            ? DateTime.tryParse(json['completedAt'] as String)
            : null,
      );
}

class DiscountModel extends DiscountEntity {
  const DiscountModel({
    required super.id,
    required super.code,
    required super.name,
    required super.type,
    required super.value,
    super.description,
    super.applicability,
    super.minOrderAmount,
    super.maxDiscountCap,
    super.maxUses,
    super.usedCount,
    super.isActive,
    super.validUntil,
  });

  factory DiscountModel.fromJson(Map<String, dynamic> json) => DiscountModel(
        id: json['id'] as String,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        type: json['type'] as String? ?? 'PERCENTAGE',
        value: parseDoubleOrZero(json['value']),
        description: json['description'] as String?,
        applicability: json['applicability'] as String?,
        minOrderAmount: parseDouble(json['minOrderAmount']),
        maxDiscountCap: parseDouble(json['maxDiscountCap']),
        maxUses: json['maxUses'] as int?,
        usedCount: json['usedCount'] as int? ?? 0,
        isActive: json['isActive'] as bool? ?? true,
        validUntil: json['validUntil'] != null
            ? DateTime.tryParse(json['validUntil'] as String)
            : null,
      );
}

class StyleModel extends StyleEntity {
  const StyleModel({
    required super.id,
    required super.name,
    required super.category,
    super.description,
    super.photoUrls,
    super.videoUrls,
    super.basePrice,
    super.stockQuantity,
    super.tags,
    super.isActive,
  });

  factory StyleModel.fromJson(Map<String, dynamic> json) => StyleModel(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        category: json['category'] as String? ?? '',
        description: json['description'] as String?,
        photoUrls: (json['photoUrls'] as List<dynamic>? ?? [])
            .map((e) => e.toString())
            .toList(),
        videoUrls: (json['videoUrls'] as List<dynamic>? ?? [])
            .map((e) => e.toString())
            .toList(),
        basePrice: parseDouble(json['basePrice']),
        stockQuantity: json['stockQuantity'] as int? ?? 0,
        tags: (json['tags'] as List<dynamic>? ?? [])
            .map((e) => e.toString())
            .toList(),
        isActive: json['isActive'] as bool? ?? true,
      );
}
