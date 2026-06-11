import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';

abstract class AuthRepository {
  Future<AuthSession> login(String email, String password);
  Future<AuthSession?> restoreSession();
  Future<UserEntity?> refreshSession();
  Future<UserEntity> getProfile();
  Future<void> logout();
  Future<void> changePassword(String current, String next);
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
