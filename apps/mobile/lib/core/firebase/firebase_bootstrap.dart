import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:stitchhub_mobile/core/notifications/push_notification_service.dart';
import 'package:stitchhub_mobile/firebase_options.dart';

/// Initializes Firebase before any plugin or service touches Firebase APIs.
Future<void> bootstrapFirebase() async {
  if (Firebase.apps.isNotEmpty) return;

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  debugPrint('Firebase initialized for ${defaultTargetPlatform.name}');
}

bool get isFirebaseReady => Firebase.apps.isNotEmpty;
