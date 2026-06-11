// File generated from Firebase project stitchhubpromax.
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('StitchHub mobile does not support web.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError('macOS is not configured for StitchHub mobile.');
      default:
        throw UnsupportedError(
          'Firebase is not configured for $defaultTargetPlatform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAE5JyjlOyj7FvUpJrlubFcPAJS2UfCcTM',
    appId: '1:359558295805:android:45e7aee91d2e4983d18e94',
    messagingSenderId: '359558295805',
    projectId: 'stitchhubpromax',
    storageBucket: 'stitchhubpromax.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDfzV3zyRQZdeg3FB5tLqP2sSMcIqqz3jU',
    appId: '1:359558295805:ios:adbbd9c795e17400d18e94',
    messagingSenderId: '359558295805',
    projectId: 'stitchhubpromax',
    storageBucket: 'stitchhubpromax.firebasestorage.app',
    iosBundleId: 'com.stitchhub.stitchhubMobile',
  );
}
