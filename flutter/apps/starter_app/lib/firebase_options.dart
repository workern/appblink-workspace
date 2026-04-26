import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_WEB_API_KEY',
    authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
    databaseURL: 'YOUR_FIREBASE_DATABASE_URL',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'YOUR_FIREBASE_WEB_APP_ID',
    measurementId: 'YOUR_FIREBASE_MEASUREMENT_ID',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_ANDROID_API_KEY',
    appId: 'YOUR_ANDROID_MOBILESDK_APP_ID_1',
    messagingSenderId: 'YOUR_FIREBASE_PROJECT_NUMBER',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    databaseURL: 'YOUR_FIREBASE_DATABASE_URL',
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_IOS_API_KEY',
    appId: 'YOUR_FIREBASE_IOS_APP_ID',
    messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    databaseURL: 'YOUR_FIREBASE_DATABASE_URL',
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
    androidClientId:
        'YOUR_FIREBASE_ANDROID_CLIENT_ID',
    iosClientId:
        'YOUR_FIREBASE_IOS_CLIENT_ID',
    iosBundleId: 'YOUR_IOS_BUNDLE_ID',
  );
}
