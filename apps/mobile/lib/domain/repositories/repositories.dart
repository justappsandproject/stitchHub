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
  Future<MeasurementEntity> createBodyMeasurement(Map<String, dynamic> data);
  Future<MeasurementEntity> updateMeasurement(String id, Map<String, dynamic> data);
}

abstract class OrdersRepository {
  Future<List<OrderEntity>> getOrders({String? status, String? customerId});
  Future<OrderEntity?> getOrder(String id);
  Future<OrderEntity> createOrder(Map<String, dynamic> data);
  Future<void> updateStatus(String orderId, String status);
  Future<void> deleteOrder(String id);
}

abstract class CustomersRepository {
  Future<List<CustomerEntity>> getCustomers({String? query});
  Future<Map<String, dynamic>> getCustomerDetail(String id);
  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data);
  Future<void> deleteCustomer(String id);
}

abstract class InventoryRepository {
  Future<Map<String, dynamic>> getDashboard();
  Future<List<Map<String, dynamic>>> listProducts({
    String? query,
    String? category,
    String? stockStatus,
  });
  Future<Map<String, dynamic>> getProduct(String id);
  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> data);
  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> data);
  Future<void> deleteProduct(String id);
  Future<Map<String, dynamic>> restockProduct(String id, Map<String, dynamic> data);
}

abstract class DashboardRepository {
  Future<DashboardSummary> getDashboard();
}

abstract class PortfolioRepository {
  Future<List<PortfolioItemEntity>> getPortfolio({String? query, bool? featured});
  Future<PortfolioItemEntity> createPortfolioItem(Map<String, dynamic> data);
  Future<PortfolioItemEntity> updatePortfolioItem(String id, Map<String, dynamic> data);
  Future<void> deletePortfolioItem(String id);
}

abstract class DiscountsRepository {
  Future<List<DiscountEntity>> getDiscounts();
  Future<DiscountEntity> createDiscount(Map<String, dynamic> data);
  Future<DiscountEntity> updateDiscount(String id, Map<String, dynamic> data);
  Future<void> deactivateDiscount(String id);
  Future<DiscountValidationResult> validateDiscount({
    required String code,
    required double orderAmount,
    String? customerId,
  });
}

abstract class MessagesRepository {
  Future<int> getUnreadCount();
  Future<List<MessageEntity>> getInbox();
  Future<List<MessageEntity>> getAdminThread(String tenantId);
  Future<List<AdminTenantEntity>> getAdminThreads();
  Future<void> sendMessage(String body, {String? tenantId});
}

abstract class StylesRepository {
  Future<List<StyleEntity>> getStyles({String? query});
  Future<StyleEntity> getStyle(String id);
  Future<StyleEntity> createStyle(Map<String, dynamic> data);
  Future<StyleEntity> updateStyle(String id, Map<String, dynamic> data);
  Future<void> deleteStyle(String id);
  Future<Map<String, dynamic>> tryOn(String styleId, [Map<String, dynamic>? body]);
}

abstract class PaymentsRepository {
  Future<Map<String, dynamic>> createInvoice({
    required String orderId,
    required num amount,
    String? notes,
    String? dueDate,
  });
  Future<Map<String, dynamic>> createPayment({
    required num amount,
    required String method,
    String? invoiceId,
    String? notes,
  });
  Future<List<Map<String, dynamic>>> getInvoices({String? orderId});
}

abstract class SubscriptionRepository {
  Future<SubscriptionEntity> getCurrent();
  Future<List<Map<String, dynamic>>> getPlans();
  Future<Map<String, dynamic>> changePlan(String plan);
}

abstract class TicketsRepository {
  Future<List<Map<String, dynamic>>> getTickets();
  Future<Map<String, dynamic>> getTicket(String id);
  Future<Map<String, dynamic>> createTicket(Map<String, dynamic> data);
  Future<Map<String, dynamic>> addReply(String ticketId, String content);
  Future<void> updateStatus(String ticketId, String status);
}

abstract class ConversationsRepository {
  Future<List<Map<String, dynamic>>> getInbox();
  Future<List<Map<String, dynamic>>> getThread(String customerId);
  Future<void> sendMessage({required String customerId, required String content});
}

abstract class AdminRepository {
  Future<List<AdminTenantEntity>> getTenants();
  Future<DashboardSummary> getPlatformDashboard();
  Future<void> updateTenant(String id, {bool? isActive, String? plan});
}
