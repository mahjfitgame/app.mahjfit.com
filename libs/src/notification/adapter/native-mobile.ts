// file: libs/src/notification/adapter/native-mobile.ts

import { Inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

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
import { NotificationRouter } from '../router';
import { NotificationState } from '../state';

@Injectable({ providedIn: 'root' })
export class NativeMobilePushAdapter implements PushNotificationAdapter {
  private initialized = false;

  constructor(
    private readonly api: NotificationApi,
    private readonly router: NotificationRouter,
    private readonly state: NotificationState,

    @Inject(NOTIFICATION_CONFIG)
    private readonly config: NotificationConfig,
  ) {}

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    this.initialized = true;

    await this.registerListeners();
    await this.createAndroidChannel();
  }

  public async identifyUser(userId: number): Promise<void> {
    this.state.setUserId(userId);
  }

  public async requestPermissionAndRegister(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    let permission = await PushNotifications.checkPermissions();

    if (
      permission.receive === 'prompt' ||
      permission.receive === 'prompt-with-rationale'
    ) {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      this.state.setPermissionGranted(false);
      await this.syncInboxIfPossible();
      return false;
    }

    this.state.setPermissionGranted(true);

    /**
     * Triggers native push registration.
     *
     * Android:
     *   returns FCM token.
     *
     * iOS:
     *   must return FCM token if backend sends via Firebase Admin.
     *   Make sure iOS native setup bridges APNs token to FCM token.
     */
    await PushNotifications.register();

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

  private async registerListeners(): Promise<void> {
    await PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        const userId = this.state.userId();
        const udvcId = this.state.udvcId();

        if (!userId) {
          this.debug('Token received, but user is not identified yet.');
          return;
        }

        this.state.setProvider(NotificationProviderEnum.FIREBASE);
        this.state.setProviderDeviceId(token.value);

        await this.api.registerDevice({
          u_id: userId,
          //platform: this.resolvePlatform(),
          provider: NotificationProviderEnum.FIREBASE,
          token: token.value,
          udvc_id: udvcId as number,
        });

        this.debug('Native mobile push token registered.');
      },
    );

    await PushNotifications.addListener(
      'registrationError',
      async (error: any) => {
        console.error('[PUSH:REGISTRATION_ERROR]', error);
      },
    );

    await PushNotifications.addListener(
      'pushNotificationReceived',
      async (_notification: PushNotificationSchema) => {
        /**
         * App is open.
         * Push payload is not source of truth.
         * Sync inbox from backend.
         */
        await this.syncInboxIfPossible();
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (event: ActionPerformed) => {
        /**
         * User tapped notification.
         * Sync inbox first, then route.
         */
        await this.syncInboxIfPossible();

        await this.router.routeByData(event.notification.data || {});
      },
    );
  }

  private async createAndroidChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    await PushNotifications.createChannel({
      id: 'mahjfit_default',
      name: 'Mahjfit Notifications',
      description: 'Game, marketing, and system notifications',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  }

  private resolvePlatform(): NotificationPlatformEnum {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      return NotificationPlatformEnum.IOS;
    }

    if (platform === 'android') {
      return NotificationPlatformEnum.ANDROID;
    }

    return NotificationPlatformEnum.UNKNOWN;
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
      console.log(`[PUSH:NATIVE] ${message}`);
    }
  }
}