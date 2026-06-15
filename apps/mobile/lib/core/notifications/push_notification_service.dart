import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:stitchhub_mobile/core/firebase/firebase_bootstrap.dart';
import 'package:stitchhub_mobile/core/storage/secure_storage.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/firebase_options.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }
}

class PushNotificationService {
  PushNotificationService(this._storage, this._authRepository);

  final SecureStorage _storage;
  final AuthRepository _authRepository;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  FirebaseMessaging? _messaging;
  bool _initialized = false;

  FirebaseMessaging get _firebaseMessaging {
    _messaging ??= FirebaseMessaging.instance;
    return _messaging!;
  }

  Future<void> initialize() async {
    if (_initialized) return;

    if (!isFirebaseReady) {
      debugPrint('Push notifications skipped: Firebase is not initialized');
      return;
    }

    try {
      const androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings();
      await _localNotifications.initialize(
        const InitializationSettings(
          android: androidSettings,
          iOS: iosSettings,
        ),
        onDidReceiveNotificationResponse: (_) {},
      );

      await _firebaseMessaging.requestPermission();

      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        await _storage.saveFcmToken(token);
        await _registerTokenWithApi(token);
      }

      FirebaseMessaging.onMessage.listen(_showForegroundNotification);
      _firebaseMessaging.onTokenRefresh.listen((token) async {
        await _storage.saveFcmToken(token);
        await _registerTokenWithApi(token);
      });

      _initialized = true;
    } catch (e, stackTrace) {
      debugPrint('Push notifications unavailable: $e\n$stackTrace');
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'stitchhub_default',
          'StitchHub',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  String? get cachedToken => _storage.readFcmToken();

  Future<void> syncTokenWithApi() async {
    if (!isFirebaseReady) return;

    final token = _storage.readFcmToken() ?? await _firebaseMessaging.getToken();
    if (token != null) {
      await _storage.saveFcmToken(token);
      await _registerTokenWithApi(token);
    }
  }

  Future<void> _registerTokenWithApi(String token) async {
    try {
      await _authRepository.registerDeviceToken(token);
    } catch (e) {
      debugPrint('FCM token registration skipped: $e');
    }
  }
}
