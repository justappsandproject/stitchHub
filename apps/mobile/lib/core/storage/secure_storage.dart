import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stitchhub_mobile/core/constants/app_constants.dart';

class SecureStorage {
  SecureStorage(this._secure, this._prefs);

  final FlutterSecureStorage _secure;
  final SharedPreferences _prefs;

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String userJson,
  }) async {
    await _secure.write(key: StorageKeys.accessToken, value: accessToken);
    await _secure.write(key: StorageKeys.refreshToken, value: refreshToken);
    await _prefs.setString(StorageKeys.userJson, userJson);
  }

  Future<String?> readAccessToken() =>
      _secure.read(key: StorageKeys.accessToken);

  Future<String?> readRefreshToken() =>
      _secure.read(key: StorageKeys.refreshToken);

  String? readUserJson() => _prefs.getString(StorageKeys.userJson);

  Map<String, dynamic>? readUserMap() {
    final raw = readUserJson();
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> saveUserJson(String userJson) =>
      _prefs.setString(StorageKeys.userJson, userJson);

  Future<void> saveFcmToken(String token) =>
      _prefs.setString(StorageKeys.fcmToken, token);

  String? readFcmToken() => _prefs.getString(StorageKeys.fcmToken);

  Future<bool> hasSession() async {
    final token = await readAccessToken();
    return token != null && token.isNotEmpty && readUserJson() != null;
  }

  Future<void> clearSession() async {
    await _secure.delete(key: StorageKeys.accessToken);
    await _secure.delete(key: StorageKeys.refreshToken);
    await _prefs.remove(StorageKeys.userJson);
  }
}
