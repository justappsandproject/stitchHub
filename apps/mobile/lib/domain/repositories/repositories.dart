import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';

abstract class AuthRepository {
  Future<AuthSession> login(String email, String password);
  Future<AuthSession> registerCustomer({
    required String tenantSlug,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
  });
  Future<AuthSession?> restoreSession();
  Future<UserEntity?> refreshSession();
  Future<UserEntity> getProfile();
  Future<UserEntity> updateProfile(Map<String, dynamic> data);
  Future<Map<String, dynamic>> forgotPassword(String email);
  Future<void> resetPassword(String token, String newPassword);
  Future<void> registerDeviceToken(String token, {String platform = 'android'});
  Future<void> logout();
  Future<void> changePassword(String current, String next);
}

abstract class UploadsRepository {
  Future<String> uploadImage(String filePath);
}

abstract class MeasurementsRepository {
  Future<List<MeasurementTemplateEntity>> getTemplates();
  Future<List<MeasurementEntity>> getByCustomer(String customerId);
  Future<List<MeasurementEntity>> getMine();
  Future<MeasurementEntity> createMeasurement(Map<String, dynamic> data);
  Future<MeasurementEntity> updateMeasurement(String id, Map<String, dynamic> data);
}

abstract class OrdersRepository {
  Future<List<OrderEntity>> getOrders({String? status});
  Future<OrderEntity?> getOrder(String id);
  Future<OrderEntity> createOrder(Map<String, dynamic> data);
  Future<void> updateStatus(String orderId, String status);
}

abstract class CustomersRepository {
  Future<List<CustomerEntity>> getCustomers({String? query});
  Future<CustomerEntity> createCustomer(Map<String, dynamic> data);
}

abstract class DashboardRepository {
  Future<DashboardSummary> getDashboard();
}

abstract class MessagesRepository {
  Future<int> getUnreadCount();
  Future<List<MessageEntity>> getInbox();
  Future<List<MessageEntity>> getAdminThread(String tenantId);
  Future<List<AdminTenantEntity>> getAdminThreads();
  Future<void> sendMessage(String body, {String? tenantId});
}

abstract class SubscriptionRepository {
  Future<SubscriptionEntity> getCurrent();
  Future<List<Map<String, dynamic>>> getPlans();
}

abstract class AdminRepository {
  Future<List<AdminTenantEntity>> getTenants();
  Future<DashboardSummary> getPlatformDashboard();
  Future<void> updateTenant(String id, {bool? isActive, String? plan});
}
