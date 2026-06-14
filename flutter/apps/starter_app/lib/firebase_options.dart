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
    apiKey: 'AIzaSyC8_KPPUsCWq1ePlfQFfHFBNws73EgQQTc',
    authDomain: 'auth.workern.com',
    databaseURL: 'https://workern-app-default-rtdb.firebaseio.com',
    projectId: 'workern-app',
    storageBucket: 'workern-app.firebasestorage.app',
    messagingSenderId: '524580981259',
    appId: '1:524580981259:web:0567301a78f5d56525150e',
    measurementId: 'G-RLLX67H1QW',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAP93px3vdz1lWROs5QI3etEfJy5GWWL8U',
    appId: '1:524580981259:android:3163ad4584360d2125150e',
    messagingSenderId: '524580981259',
    projectId: 'workern-app',
    databaseURL: 'https://workern-app-default-rtdb.firebaseio.com',
    storageBucket: 'workern-app.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCKq-I2ydd_ERFvTJ6IkzmAqmU8Mkft2gY',
    appId: '1:524580981259:ios:a353f4c1ea701b9725150e',
    messagingSenderId: '524580981259',
    projectId: 'workern-app',
    databaseURL: 'https://workern-app-default-rtdb.firebaseio.com',
    storageBucket: 'workern-app.firebasestorage.app',
    androidClientId:
        '',
    iosClientId:
        '',
    iosBundleId: 'com.workern.starterApp',
  );
}
