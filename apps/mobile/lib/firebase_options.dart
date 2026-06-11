import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Firebase configuration for StitchHub Mobile (`stitchhubpromax`).
///
/// After registering Android/iOS apps in Firebase Console, run:
/// ```bash
/// firebase login
/// cd apps/mobile
/// flutterfire configure --project=stitchhubpromax
/// ```
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
    apiKey: 'AIzaSyPLACEHOLDER_ANDROID_KEY_REPLACE_ME',
    appId: '1:359558295805:android:0000000000000000000000',
    messagingSenderId: '359558295805',
    projectId: 'stitchhubpromax',
    storageBucket: 'stitchhubpromax.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyPLACEHOLDER_IOS_KEY_REPLACE_ME',
    appId: '1:359558295805:ios:0000000000000000000000',
    messagingSenderId: '359558295805',
    projectId: 'stitchhubpromax',
    storageBucket: 'stitchhubpromax.firebasestorage.app',
    iosBundleId: 'com.stitchhub.stitchhubMobile',
  );
}
