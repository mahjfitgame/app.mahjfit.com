// file: libs/src/notification/service.ts

import { Inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { FirebaseWebPushAdapter } from './adapter/firebase-web';
import { NativeMobilePushAdapter } from './adapter/native-mobile';
import { NoopPushAdapter } from './adapter/noop-push';
import { NotificationApi } from './api';
import { NotificationConfig, PushNotificationAdapter } from './model';
import { NotificationState } from './state';
import { NOTIFICATION_CONFIG } from './token';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private adapter: PushNotificationAdapter | null = null;

  constructor(
    private readonly nativeMobileAdapter: NativeMobilePushAdapter,
    private readonly firebaseWebAdapter: FirebaseWebPushAdapter,
    private readonly noopAdapter: NoopPushAdapter,
    private readonly api: NotificationApi,
    private readonly state: NotificationState,

    @Inject(NOTIFICATION_CONFIG)
    private readonly config: NotificationConfig,
  ) {}

  public async init(): Promise<void> {
    if (this.state.initialized()) {
      return;
    }

    this.adapter = this.resolveAdapter();

    await this.adapter.init();

    this.state.setInitialized(true);
  }

  public async identifyUser(userId: number): Promise<void> {
    await this.init();

    this.state.setUserId(userId);

    if (!this.adapter) {
      this.adapter = this.resolveAdapter();
    }

    await this.adapter.identifyUser(userId);

    await this.syncInbox();
  }

  public async requestPermissionAndRegister(): Promise<boolean> {
    await this.init();

    if (!this.adapter) {
      this.adapter = this.resolveAdapter();
    }

    return await this.adapter.requestPermissionAndRegister();
  }

  public async syncInbox(): Promise<void> {
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

  public async markRead(notificationEventId: string): Promise<void> {
    const userId = this.state.userId();

    if (!userId) {
      return;
    }

    await this.api.markRead({
      user_id: userId,
      notification_event_id: notificationEventId,
    });

    await this.syncInbox();
  }

  public async logout(): Promise<void> {
    if (!this.adapter) {
      this.adapter = this.resolveAdapter();
    }

    await this.adapter.logout();

    this.state.reset();
  }

  private resolveAdapter(): PushNotificationAdapter {
    if (Capacitor.isNativePlatform()) {
      return this.nativeMobileAdapter;
    }

    if (this.config.enableWebPush) {
      return this.firebaseWebAdapter;
    }

    return this.noopAdapter;
  }
}


/* import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

type PushPermissionState =
  | 'prompt'
  | 'prompt-with-rationale'
  | 'granted'
  | 'denied';

@Injectable({ providedIn: 'root' })
export class MobilePushNotificationService {
  private readonly router = inject(Router);

  private initialized = false;

  private readonly tokenStore = signal<string | null>(null);
  public readonly token = this.tokenStore.asReadonly();

  private readonly permissionStore = signal<PushPermissionState>('prompt');
  public readonly permission = this.permissionStore.asReadonly();

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    this.initialized = true;

    await this.addListeners();
    await this.createAndroidChannel();
  }

  public async requestPermissionAndRegister(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    let permission = await PushNotifications.checkPermissions();
    this.permissionStore.set(permission.receive);

    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
      this.permissionStore.set(permission.receive);
    }

    if (permission.receive !== 'granted') {
      return false;
    }

    await PushNotifications.register();
    return true;
  }

  private async addListeners(): Promise<void> {
    await PushNotifications.addListener('registration', async (token: Token) => {
      this.tokenStore.set(token.value);

      await this.registerTokenWithBackend(token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[PUSH:REGISTRATION_ERROR]', error);
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[PUSH:RECEIVED]', notification);

        // App is open. Update Angular signal/store here if needed.
        // Do not rely on push for real-time gameplay state.
        // Your WebSocket should still be the live source.
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (event: ActionPerformed) => {
        console.log('[PUSH:ACTION]', event);

        await this.handleNotificationTap(event.notification.data);
      },
    );
  }

  private async createAndroidChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    await PushNotifications.createChannel({
      id: 'mahjfit_game_updates',
      name: 'Game Updates',
      description: 'Turn alerts, invites, and game reminders',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  }

  private async handleNotificationTap(data: any): Promise<void> {
    if (!data) {
      return;
    }

    switch (data.type) {
      case 'GAME_TURN':
        if (data.game_id) {
          await this.router.navigate(['/game', data.game_id]);
        }
        break;

      case 'GAME_INVITE':
        if (data.game_id) {
          await this.router.navigate(['/game/invite', data.game_id]);
        }
        break;

      default:
        await this.router.navigate(['/']);
        break;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    const input = {
      token,
      platform: Capacitor.getPlatform(),
      app_id: 'com.mahjfit.app',
    };

    console.log('[PUSH:TOKEN_REGISTER_INPUT]', input);

    // Replace this with your GraphQL mutation / REST call.
    // Example:
    // await this.pushApi.registerDevice(input);
  }
} */