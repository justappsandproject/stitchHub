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
}

class NetworkException implements Exception {
  NetworkException([this.message = 'Network error']);
  final String message;
}
