import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stitchhub_mobile/core/constants/app_constants.dart';
import 'package:stitchhub_mobile/core/network/api_client.dart';
import 'package:stitchhub_mobile/core/network/network_info.dart';
import 'package:stitchhub_mobile/core/notifications/push_notification_service.dart';
import 'package:stitchhub_mobile/core/payments/paystack_service.dart';
import 'package:stitchhub_mobile/core/storage/local_database.dart';
import 'package:stitchhub_mobile/core/storage/secure_storage.dart';
import 'package:stitchhub_mobile/core/sync/sync_manager.dart';
import 'package:stitchhub_mobile/core/sync/sync_queue.dart';
import 'package:stitchhub_mobile/data/models/models.dart';
import 'package:stitchhub_mobile/data/repositories/repository_impls.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/presentation/blocs/auth/auth_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/billing/billing_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/dashboard/dashboard_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/messages/messages_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/orders/orders_bloc.dart';
import 'package:stitchhub_mobile/presentation/blocs/sync/sync_bloc.dart';

final sl = GetIt.instance;

Future<void> initDependencies({String? apiBaseUrl}) async {
  final prefs = await SharedPreferences.getInstance();
  const secure = FlutterSecureStorage();

  sl
    ..registerLazySingleton<SharedPreferences>(() => prefs)
    ..registerLazySingleton<SecureStorage>(
      () => SecureStorage(secure, prefs),
    )
    ..registerLazySingleton<LocalDatabase>(() => LocalDatabase())
    ..registerLazySingleton<Connectivity>(() => Connectivity())
    ..registerLazySingleton<NetworkInfo>(
      () => NetworkInfoImpl(sl()),
    )
    ..registerLazySingleton<SyncQueue>(() => SyncQueue(sl()));

  final baseUrl = apiBaseUrl ?? ApiConstants.defaultBaseUrl;

  sl.registerLazySingleton<ApiClient>(
    () => ApiClient(
      baseUrl: baseUrl,
      secureStorage: sl(),
      onRefresh: () => _refreshAccessToken(baseUrl, sl()),
    ),
  );

  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(apiClient: sl(), secureStorage: sl()),
  );

  sl
    ..registerLazySingleton<OrdersRepository>(
      () => OrdersRepositoryImpl(
        apiClient: sl(),
        localDatabase: sl(),
        networkInfo: sl(),
        syncQueue: sl(),
      ),
    )
    ..registerLazySingleton<CustomersRepository>(
      () => CustomersRepositoryImpl(
        apiClient: sl(),
        localDatabase: sl(),
        networkInfo: sl(),
        syncQueue: sl(),
      ),
    )
    ..registerLazySingleton<DashboardRepository>(
      () => DashboardRepositoryImpl(sl()),
    )
    ..registerLazySingleton<MessagesRepository>(
      () => MessagesRepositoryImpl(
        apiClient: sl(),
        localDatabase: sl(),
        networkInfo: sl(),
        syncQueue: sl(),
      ),
    )
    ..registerLazySingleton<SubscriptionRepository>(
      () => SubscriptionRepositoryImpl(sl()),
    )
    ..registerLazySingleton<AdminRepository>(
      () => AdminRepositoryImpl(sl()),
    )
    ..registerLazySingleton<UploadsRepository>(
      () => UploadsRepositoryImpl(sl()),
    )
    ..registerLazySingleton<MeasurementsRepository>(
      () => MeasurementsRepositoryImpl(sl()),
    )
    ..registerLazySingleton<PortfolioRepository>(
      () => PortfolioRepositoryImpl(sl()),
    )
    ..registerLazySingleton<DiscountsRepository>(
      () => DiscountsRepositoryImpl(sl()),
    )
    ..registerLazySingleton<PaystackService>(() => PaystackService(sl()))
    ..registerLazySingleton<SyncManager>(
      () => SyncManager(
        networkInfo: sl(),
        syncQueue: sl(),
        apiClient: sl(),
      ),
    )
    ..registerLazySingleton<PushNotificationService>(
      () => PushNotificationService(sl(), sl()),
    )
    ..registerFactory(() => AuthBloc(sl()))
    ..registerFactory(() => OrdersBloc(sl()))
    ..registerFactory(() => DashboardBloc(
          dashboardRepository: sl(),
          adminRepository: sl(),
        ))
    ..registerFactory(() => MessagesBloc(sl()))
    ..registerFactory(() => BillingBloc(
          subscriptionRepository: sl(),
          paystackService: sl(),
        ))
    ..registerLazySingleton(
      () => SyncBloc(sl<SyncManager>(), sl<NetworkInfo>()),
    );

  await sl<LocalDatabase>().init();
}

Future<String?> _refreshAccessToken(
  String baseUrl,
  SecureStorage secureStorage,
) async {
  final refreshToken = await secureStorage.readRefreshToken();
  if (refreshToken == null) return null;

  try {
    final dio = Dio(BaseOptions(baseUrl: baseUrl));
    final response = await dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final data = response.data!;
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    await secureStorage.saveSession(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      userJson: user.toJsonString(),
    );
    return data['accessToken'] as String;
  } catch (_) {
    await secureStorage.clearSession();
    return null;
  }
}
