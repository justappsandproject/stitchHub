class ApiException implements Exception {
  ApiException({
    required this.message,
    required this.statusCode,
    this.code,
  });

  final String message;
  final int statusCode;
  final String? code;

  bool get isSessionExpired => code == 'SESSION_EXPIRED';
  bool get isSubscriptionSuspended => code == 'SUBSCRIPTION_SUSPENDED';
  bool get isPlanLimitReached => code == 'PLAN_LIMIT_REACHED';

  @override
  String toString() => message;
}

String errorMessage(Object error) {
  if (error is ApiException) return error.message;
  if (error is NetworkException) return error.message;
  return error.toString();
}

class NetworkException implements Exception {
  NetworkException([this.message = 'Network error']);
  final String message;
}
