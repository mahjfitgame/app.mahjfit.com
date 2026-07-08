// file: libs/src/notification/adapter/firebase-web-push.adapter.ts

import { Inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import {
  NotificationPlatformEnum,
  NotificationProviderEnum,
} from '../enum';
import {
  NotificationConfig,
  PushNotificationAdapter,
} from '../model';
import { NOTIFICATION_CONFIG } from '../token';
import { NotificationApi } from '../api';
import { NotificationState } from '../state';

@Injectable({ providedIn: 'root' })
export class FirebaseWebPushAdapter implements PushNotificationAdapter {
  private initialized = false;
  private messaging: any = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(
    private readonly api: NotificationApi,
    private readonly state: NotificationState,

    @Inject(NOTIFICATION_CONFIG)
    private readonly config: NotificationConfig,
  ) {}

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      return;
    }

    if (!this.config.enableWebPush) {
      this.debug('Web push disabled.');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      this.debug('Service worker not supported.');
      return;
    }

    const firebaseConfig = this.config.web?.firebaseConfig;

    if (!firebaseConfig) {
      throw new Error('Firebase web config is missing.');
    }

    const serviceWorkerPath =
      this.config.web?.serviceWorkerPath || '/firebase-messaging-sw.js';

    this.serviceWorkerRegistration =
      await navigator.serviceWorker.register(serviceWorkerPath);

    /**
     * Dynamic imports.
     * This keeps Firebase JS out of native mobile runtime.
     */
    const firebaseApp = await import('firebase/app');
    const firebaseMessaging = await import('firebase/messaging');

    const supported = await firebaseMessaging.isSupported();

    if (!supported) {
      this.debug('Firebase web messaging not supported in this browser.');
      return;
    }

    const app = firebaseApp.initializeApp(firebaseConfig);
    this.messaging = firebaseMessaging.getMessaging(app);

    firebaseMessaging.onMessage(this.messaging, async (payload: any) => {
      this.debug('Foreground web push received.');
      console.log('[PUSH:WEB_FOREGROUND]', payload);

      await this.syncInboxIfPossible();
    });

    this.initialized = true;
  }

  public async identifyUser(userId: number): Promise<void> {
    this.state.setUserId(userId);
  }

  public async requestPermissionAndRegister(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return false;
    }

    if (!this.config.enableWebPush) {
      return false;
    }

    await this.init();

    if (!this.messaging) {
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      this.state.setPermissionGranted(false);
      await this.syncInboxIfPossible();
      return false;
    }

    this.state.setPermissionGranted(true);

    const vapidKey = this.config.web?.firebaseVapidKey;

    if (!vapidKey) {
      throw new Error('Firebase web VAPID key is missing.');
    }

    const firebaseMessaging = await import('firebase/messaging');

    const token = await firebaseMessaging.getToken(this.messaging, {
      vapidKey,
      serviceWorkerRegistration: this.serviceWorkerRegistration || undefined,
    });

    const userId = this.state.userId();
    const udvcId = this.state.udvcId();

    if (!userId) {
      this.debug('Web token received, but user is not identified yet.');
      return false;
    }

    this.state.setProvider(NotificationProviderEnum.FIREBASE);
    this.state.setProviderDeviceId(token);

    await this.api.registerDevice({
      u_id: userId,
      //app_code: this.config.appCode,
      //platform: NotificationPlatformEnum.WEB,
      //environment: this.config.environment,
      provider: NotificationProviderEnum.FIREBASE,
      token: token,
      udvc_id: udvcId as number,
    });

    this.debug('Firebase web push token registered.');

    return true;
  }

  public async logout(): Promise<void> {
    const userId = this.state.userId();

    if (!userId) {
      return;
    }

    await this.api.disableDevice({
      user_id: userId,
      app_code: this.config.appCode,
      provider: NotificationProviderEnum.FIREBASE,
      provider_device_id: this.state.providerDeviceId() || undefined,
    });

    this.state.setProviderDeviceId(null);
  }

  private async syncInboxIfPossible(): Promise<void> {
    const userId = this.state.userId();

    if (!userId) {
      return;
    }

    const inbox = await this.api.inbox({
      user_id: userId,
      app_code: this.config.appCode,
      limit: 30,
      offset: 0,
    });

    this.state.setInbox(inbox.items, inbox.total);
  }

  private debug(message: string): void {
    if (this.config.debug) {
      console.log(`[PUSH:WEB] ${message}`);
    }
  }
}