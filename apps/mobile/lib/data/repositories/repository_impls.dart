import 'package:stitchhub_mobile/core/constants/app_constants.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/network/api_client.dart';
import 'package:stitchhub_mobile/core/network/network_info.dart';
import 'package:stitchhub_mobile/core/storage/local_database.dart';
import 'package:stitchhub_mobile/core/storage/secure_storage.dart';
import 'package:stitchhub_mobile/core/sync/sync_queue.dart';
import 'package:stitchhub_mobile/data/models/models.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required ApiClient apiClient,
    required SecureStorage secureStorage,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage;

  final ApiClient _apiClient;
  final SecureStorage _secureStorage;

  @override
  Future<AuthSession> login(String email, String password) async {
    final json = await _apiClient.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return _persistSession(json);
  }

  @override
  Future<AuthSession?> restoreSession() async {
    final accessToken = await _secureStorage.readAccessToken();
    final refreshToken = await _secureStorage.readRefreshToken();
    final userMap = _secureStorage.readUserMap();
    if (accessToken == null || refreshToken == null || userMap == null) {
      return null;
    }
    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: UserModel.fromJson(userMap),
    );
  }

  @override
  Future<UserEntity?> refreshSession() async {
    final refreshToken = await _secureStorage.readRefreshToken();
    if (refreshToken == null) return null;

    try {
      final json = await _apiClient.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final session = await _persistSession(json);
      return session.user;
    } catch (_) {
      await _secureStorage.clearSession();
      return null;
    }
  }

  @override
  Future<UserEntity> getProfile() async {
    final json = await _apiClient.get('/auth/me');
    final user = UserModel.fromJson(json);
    await _secureStorage.saveUserJson(user.toJsonString());
    return user;
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post('/auth/logout');
    } catch (_) {}
    await _secureStorage.clearSession();
  }

  @override
  Future<void> changePassword(String current, String next) async {
    await _apiClient.patch(
      '/auth/password',
      data: {'currentPassword': current, 'newPassword': next},
    );
  }

  Future<AuthSession> _persistSession(Map<String, dynamic> json) async {
    final user = UserModel.fromJson(json['user'] as Map<String, dynamic>);
    final accessToken = json['accessToken'] as String;
    final refreshToken = json['refreshToken'] as String;
    await _secureStorage.saveSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userJson: user.toJsonString(),
    );
    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: user,
    );
  }
}

class OrdersRepositoryImpl implements OrdersRepository {
  OrdersRepositoryImpl({
    required ApiClient apiClient,
    required LocalDatabase localDatabase,
    required NetworkInfo networkInfo,
    required SyncQueue syncQueue,
  })  : _apiClient = apiClient,
        _localDatabase = localDatabase,
        _networkInfo = networkInfo,
        _syncQueue = syncQueue;

  final ApiClient _apiClient;
  final LocalDatabase _localDatabase;
  final NetworkInfo _networkInfo;
  final SyncQueue _syncQueue;

  @override
  Future<List<OrderEntity>> getOrders({String? status}) async {
    if (await _networkInfo.isConnected) {
      try {
        final list = await _apiClient.getList(
          '/orders',
          queryParameters: status != null ? {'status': status} : null,
        );
        final orders = list
            .cast<Map<String, dynamic>>()
            .map(OrderModel.fromJson)
            .toList();
        await _localDatabase.saveOrders(
          orders.map((o) => _orderToMap(o)).toList(),
        );
        return orders;
      } on ApiException catch (e) {
        if (e.statusCode != 401) rethrow;
      }
    }
    return _localDatabase
        .readOrders()
        .map(OrderModel.fromJson)
        .toList();
  }

  @override
  Future<OrderEntity?> getOrder(String id) async {
    try {
      final json = await _apiClient.get('/orders/$id');
      return OrderModel.fromJson(json);
    } catch (_) {
      final cached = _localDatabase.readOrders().firstWhere(
            (o) => o['id'] == id,
            orElse: () => {},
          );
      if (cached.isEmpty) return null;
      return OrderModel.fromJson(cached);
    }
  }

  @override
  Future<OrderEntity> createOrder(Map<String, dynamic> data) async {
    if (!await _networkInfo.isConnected) {
      await _syncQueue.enqueue(SyncActions.createOrder, data);
      throw NetworkException('Order queued for sync when online');
    }
    final json = await _apiClient.post('/orders', data: data);
    return OrderModel.fromJson(json);
  }

  @override
  Future<void> updateStatus(String orderId, String status) async {
    if (!await _networkInfo.isConnected) {
      await _syncQueue.enqueue(SyncActions.updateOrderStatus, {
        'orderId': orderId,
        'status': status,
      });
      return;
    }
    await _apiClient.patch('/orders/$orderId/status', data: {'status': status});
  }

  Map<String, dynamic> _orderToMap(OrderModel order) => {
        'id': order.id,
        'orderNumber': order.orderNumber,
        'status': order.status.value,
        'customer': {'firstName': order.customerName, 'lastName': ''},
        'totalAmount': order.totalAmount,
        'createdAt': order.createdAt.toIso8601String(),
        'fabric': order.fabric,
        'deliveryDate': order.deliveryDate?.toIso8601String(),
        'priority': order.priority,
        'balanceAmount': order.balanceAmount,
      };
}

class CustomersRepositoryImpl implements CustomersRepository {
  CustomersRepositoryImpl({
    required ApiClient apiClient,
    required LocalDatabase localDatabase,
    required NetworkInfo networkInfo,
    required SyncQueue syncQueue,
  })  : _apiClient = apiClient,
        _localDatabase = localDatabase,
        _networkInfo = networkInfo,
        _syncQueue = syncQueue;

  final ApiClient _apiClient;
  final LocalDatabase _localDatabase;
  final NetworkInfo _networkInfo;
  final SyncQueue _syncQueue;

  @override
  Future<List<CustomerEntity>> getCustomers({String? query}) async {
    if (await _networkInfo.isConnected) {
      final list = await _apiClient.getList(
        '/customers',
        queryParameters: query != null ? {'q': query} : null,
      );
      final customers = list
          .cast<Map<String, dynamic>>()
          .map(CustomerModel.fromJson)
          .toList();
      await _localDatabase.saveCustomers(
        customers
            .map(
              (c) => {
                'id': c.id,
                'firstName': c.firstName,
                'lastName': c.lastName,
                'phone': c.phone,
                'email': c.email,
                'isVip': c.isVip,
              },
            )
            .toList(),
      );
      return customers;
    }
    return _localDatabase
        .readCustomers()
        .map(CustomerModel.fromJson)
        .toList();
  }

  @override
  Future<CustomerEntity> createCustomer(Map<String, dynamic> data) async {
    if (!await _networkInfo.isConnected) {
      await _syncQueue.enqueue(SyncActions.createCustomer, data);
      throw NetworkException('Customer queued for sync when online');
    }
    final json = await _apiClient.post('/customers', data: data);
    return CustomerModel.fromJson(json);
  }
}

class DashboardRepositoryImpl implements DashboardRepository {
  DashboardRepositoryImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<DashboardSummary> getDashboard() async {
    final json = await _apiClient.get('/dashboard');
    final summary = json['summary'] as Map<String, dynamic>? ?? json;

    if (summary.containsKey('totalTenants')) {
      return DashboardSummary(
        title: 'Platform Overview',
        stats: [
          DashboardStat(label: 'Fashion Houses', value: summary['totalTenants'] ?? 0),
          DashboardStat(label: 'Active Houses', value: summary['activeTenants'] ?? 0),
          DashboardStat(label: 'Platform Users', value: summary['totalUsers'] ?? 0),
          DashboardStat(label: 'Total Orders', value: summary['totalOrders'] ?? 0),
          DashboardStat(
            label: 'MRR',
            value: summary['monthlyRecurringRevenue'] ?? 0,
            isCurrency: true,
          ),
        ],
      );
    }

    return DashboardSummary(
      title: 'Atelier Dashboard',
      stats: [
        DashboardStat(label: 'Customers', value: summary['totalCustomers'] ?? 0),
        DashboardStat(label: 'Active Orders', value: summary['activeOrders'] ?? 0),
        DashboardStat(label: 'Revenue (month)', value: summary['monthlyRevenue'] ?? 0, isCurrency: true),
        DashboardStat(label: 'Pending Payments', value: summary['pendingPayments'] ?? 0, isCurrency: true),
      ],
    );
  }
}

class MessagesRepositoryImpl implements MessagesRepository {
  MessagesRepositoryImpl({
    required ApiClient apiClient,
    required LocalDatabase localDatabase,
    required NetworkInfo networkInfo,
    required SyncQueue syncQueue,
  })  : _apiClient = apiClient,
        _localDatabase = localDatabase,
        _networkInfo = networkInfo,
        _syncQueue = syncQueue;

  final ApiClient _apiClient;
  final LocalDatabase _localDatabase;
  final NetworkInfo _networkInfo;
  final SyncQueue _syncQueue;

  @override
  Future<int> getUnreadCount() async {
    final json = await _apiClient.get('/messages/unread-count');
    return json['count'] as int? ?? 0;
  }

  @override
  Future<List<MessageEntity>> getInbox() async {
    const key = 'inbox';
    if (await _networkInfo.isConnected) {
      final json = await _apiClient.get('/messages/inbox');
      final messages = (json['messages'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>()
          .map(MessageModel.fromJson)
          .toList();
      await _localDatabase.saveMessages(
        key,
        messages.map((m) => _messageToMap(m)).toList(),
      );
      return messages;
    }
    return _localDatabase
        .readMessages(key)
        .map(MessageModel.fromJson)
        .toList();
  }

  @override
  Future<List<MessageEntity>> getAdminThread(String tenantId) async {
    final json = await _apiClient.get('/messages/tenant/$tenantId');
    return (json['messages'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>()
        .map(MessageModel.fromJson)
        .toList();
  }

  @override
  Future<List<AdminTenantEntity>> getAdminThreads() async {
    final list = await _apiClient.getList('/messages/threads');
    return list.cast<Map<String, dynamic>>().map((thread) {
      return AdminTenantModel(
        id: thread['tenantId'] as String,
        name: thread['tenantName'] as String? ?? '',
        slug: thread['slug'] as String? ?? '',
        isActive: true,
        plan: null,
        subscriptionStatus: null,
      );
    }).toList();
  }

  @override
  Future<void> sendMessage(String body, {String? tenantId}) async {
    final payload = {'body': body, if (tenantId != null) 'tenantId': tenantId};
    if (!await _networkInfo.isConnected) {
      await _syncQueue.enqueue(SyncActions.sendMessage, payload);
      return;
    }
    await _apiClient.post('/messages', data: payload);
  }

  Map<String, dynamic> _messageToMap(MessageModel m) => {
        'id': m.id,
        'body': m.body,
        'createdAt': m.createdAt.toIso8601String(),
        'readAt': m.readAt?.toIso8601String(),
        'sender': {
          'firstName': m.senderName.split(' ').first,
          'lastName': m.senderName.split(' ').skip(1).join(' '),
          'role': m.senderRole.value,
        },
      };
}

class SubscriptionRepositoryImpl implements SubscriptionRepository {
  SubscriptionRepositoryImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<SubscriptionEntity> getCurrent() async {
    final json = await _apiClient.get('/subscriptions/current');
    return SubscriptionModel.fromJson(json);
  }

  @override
  Future<List<Map<String, dynamic>>> getPlans() async {
    final list = await _apiClient.getList('/subscriptions/plans');
    return list.cast<Map<String, dynamic>>();
  }
}

class AdminRepositoryImpl implements AdminRepository {
  AdminRepositoryImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<DashboardSummary> getPlatformDashboard() async {
    return DashboardRepositoryImpl(_apiClient).getDashboard();
  }

  @override
  Future<List<AdminTenantEntity>> getTenants() async {
    final list = await _apiClient.getList('/tenants');
    return list
        .cast<Map<String, dynamic>>()
        .map(AdminTenantModel.fromJson)
        .toList();
  }

  @override
  Future<void> updateTenant(String id, {bool? isActive, String? plan}) async {
    await _apiClient.patch('/tenants/$id/admin', data: {
      if (isActive != null) 'isActive': isActive,
      if (plan != null) 'plan': plan,
    });
  }
}
