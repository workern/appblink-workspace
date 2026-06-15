import '@angular/compiler';
import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';
import { provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { APP_ROUTES } from './app.routes';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideFirestore,
  getFirestore,
  connectFirestoreEmulator
} from '@angular/fire/firestore';
import {
  provideFunctions,
  getFunctions,
  connectFunctionsEmulator
} from '@angular/fire/functions';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { provideServiceWorker } from '@angular/service-worker';
import { environment as env } from '../environments/environment';
import { ROUTER_CONFIG } from './app.routes.config';
import { provideI18n } from '@workern/services';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, ...ROUTER_CONFIG),
    provideFirebaseApp(() => initializeApp(env.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (env.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8081);
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      if (env.useEmulators) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9100');
      }
      return auth;
    }),
    provideFunctions(() => {
      const app = getApp();
      const functions = getFunctions(app, 'asia-south2');
      if (env.useEmulators) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideAnalytics(() => getAnalytics()),
    provideI18n(),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
