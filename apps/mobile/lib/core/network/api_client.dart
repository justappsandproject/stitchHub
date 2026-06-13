import 'package:dio/dio.dart';
import 'package:stitchhub_mobile/core/constants/app_constants.dart';
import 'package:stitchhub_mobile/core/error/exceptions.dart';
import 'package:stitchhub_mobile/core/storage/secure_storage.dart';

typedef TokenRefreshCallback = Future<String?> Function();

class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required SecureStorage secureStorage,
    required TokenRefreshCallback onRefresh,
  })  : _secureStorage = secureStorage,
        _onRefresh = onRefresh;

  final SecureStorage _secureStorage;
  final TokenRefreshCallback _onRefresh;
  Future<String?>? _refreshFuture;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401 ||
        err.requestOptions.path.contains('/auth/')) {
      return handler.next(err);
    }

    _refreshFuture ??= _onRefresh();
    final newToken = await _refreshFuture!;
    _refreshFuture = null;

    if (newToken == null) {
      await _secureStorage.clearSession();
      return handler.next(err);
    }

    final retryOptions = err.requestOptions;
    retryOptions.headers['Authorization'] = 'Bearer $newToken';

    try {
      final dio = Dio(BaseOptions(baseUrl: retryOptions.baseUrl));
      final response = await dio.fetch(retryOptions);
      return handler.resolve(response);
    } on DioException catch (retryErr) {
      return handler.next(retryErr);
    }
  }
}

class ApiClient {
  ApiClient({
    required String baseUrl,
    required SecureStorage secureStorage,
    required TokenRefreshCallback onRefresh,
  }) : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: ApiConstants.connectTimeout,
            receiveTimeout: ApiConstants.receiveTimeout,
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      AuthInterceptor(secureStorage: secureStorage, onRefresh: onRefresh),
    );
  }

  final Dio _dio;

  Dio get dio => _dio;

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        path,
        queryParameters: queryParameters,
      );
      return _unwrap(response.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<List<dynamic>> getList(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        path,
        queryParameters: queryParameters,
      );
      return response.data ?? [];
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: data);
      return _unwrap(response.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(path, data: data);
      return _unwrap(response.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete(path);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<Map<String, dynamic>> uploadFile(String path, String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });
      final response = await _dio.post<Map<String, dynamic>>(
        path,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return _unwrap(response.data);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Map<String, dynamic> _unwrap(Map<String, dynamic>? data) =>
      data ?? <String, dynamic>{};

  ApiException _mapError(DioException error) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      throw NetworkException();
    }

    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      return ApiException(
        message: data['message']?.toString() ?? 'Request failed',
        statusCode: error.response?.statusCode ?? 500,
        code: data['code']?.toString(),
      );
    }

    return ApiException(
      message: error.message ?? 'Request failed',
      statusCode: error.response?.statusCode ?? 500,
    );
  }
}
