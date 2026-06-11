import 'package:stitchhub_mobile/core/network/api_client.dart';

class PaystackConfig {
  const PaystackConfig({required this.enabled, this.publicKey});

  final bool enabled;
  final String? publicKey;

  factory PaystackConfig.fromJson(Map<String, dynamic> json) => PaystackConfig(
        enabled: json['enabled'] as bool? ?? false,
        publicKey: json['publicKey'] as String?,
      );
}

class PaystackInitializeResult {
  const PaystackInitializeResult({
    required this.authorizationUrl,
    required this.reference,
    required this.amount,
    required this.plan,
  });

  final String authorizationUrl;
  final String reference;
  final num amount;
  final String plan;

  factory PaystackInitializeResult.fromJson(Map<String, dynamic> json) =>
      PaystackInitializeResult(
        authorizationUrl: json['authorizationUrl'] as String,
        reference: json['reference'] as String,
        amount: json['amount'] as num,
        plan: json['plan'] as String,
      );
}

class PaystackVerifyResult {
  const PaystackVerifyResult({
    required this.status,
    this.plan,
    this.tenantId,
  });

  final String status;
  final String? plan;
  final String? tenantId;

  factory PaystackVerifyResult.fromJson(Map<String, dynamic> json) =>
      PaystackVerifyResult(
        status: json['status'] as String? ?? 'FAILED',
        plan: json['plan'] as String?,
        tenantId: json['tenantId'] as String?,
      );
}

class PaystackService {
  PaystackService(this._apiClient);

  final ApiClient _apiClient;

  Future<PaystackConfig> getConfig() async {
    final json = await _apiClient.get('/subscriptions/paystack/config');
    return PaystackConfig.fromJson(json);
  }

  Future<PaystackInitializeResult> initialize(String plan) async {
    final json = await _apiClient.post(
      '/subscriptions/paystack/initialize',
      data: {'plan': plan},
    );
    return PaystackInitializeResult.fromJson(json);
  }

  Future<PaystackVerifyResult> verify(String reference) async {
    final json = await _apiClient.get(
      '/subscriptions/paystack/verify',
      queryParameters: {'reference': reference},
    );
    return PaystackVerifyResult.fromJson(json);
  }

  Future<Map<String, dynamic>> changePlan(String plan) async {
    return _apiClient.post('/subscriptions/change-plan', data: {'plan': plan});
  }
}
