// file: src/app/base/push-notification/provider.ts
import { ConfService } from '@libs/conf/service';

import { provideNotificationWithFactory } from '@libs/notification/provider';
import {
  NotificationEnvironmentEnum,
  NotificationTypeEnum,
} from '@libs/notification/enum';
import { NotificationConfig } from '@libs/notification/model';

export function pushNotificationConfigFactory(
  conf: ConfService,
): NotificationConfig {
  return {
    /**
     * Project/application code used by backend to identify this app.
     */
    appCode: conf.projectName,

    /**
     * Runtime environment.
     */
    environment: conf.isProductionEnv
      ? NotificationEnvironmentEnum.PRODUCTION
      : NotificationEnvironmentEnum.DEVELOPMENT,

    /**
     * Backend GraphQL endpoint.
     * Frontend only registers token and reads inbox.
     * Backend sends push using firebase-admin.
     */
    graphqlEndpoint: conf.bfwApiSdkGraphqlUrl,

    /**
     * Web push is controlled from ConfService.
     * Mobile push works independently through @capacitor/push-notifications.
     */
    enableWebPush: conf.enableWebPush??false,

    /**
     * Required only when enableWebPush = true.
     * Used only by Web/PWA adapter.
     */
    web: {
      firebaseConfig: {
        apiKey: conf.firebaseWebApiKey,
        authDomain: conf.firebaseWebAuthDomain,
        projectId: conf.firebaseWebProjectId,
        storageBucket: conf.firebaseWebStorageBucket,
        messagingSenderId: conf.firebaseWebMessagingSenderId,
        appId: conf.firebaseWebAppId,
        measurementId: conf.firebaseWebMeasurementId,
      },

      firebaseVapidKey: conf.firebaseWebVapidKey,
      serviceWorkerPath: conf.pushNotificationSwPath,
    },

    /**
     * Auth headers for GraphQL API calls.
     */
    getAuthHeaders: (): Record<string, string> => {
      const token = conf.bfwApiSdkJwtAccessToken?.trim();

      if (!token) {
        return {} as Record<string, string>;
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    },

    /**
     * Notification tap route mapping.
     */
    routes: {
      [NotificationTypeEnum.GAME_INVITE]: (data: any) => [
        '/game',
        'invite',
        data.game_id,
      ],

      [NotificationTypeEnum.GAME_PLAY_REMINDER]: (data: any) => [
        '/game',
        data.game_id,
      ],

      [NotificationTypeEnum.GAME_PLAYER_LEFT]: (data: any) => [
        '/game',
        data.game_id,
      ],

      [NotificationTypeEnum.GAME_TURN_TIMEOUT_WARNING]: (data: any) => [
        '/game',
        data.game_id,
      ],

      [NotificationTypeEnum.MARKETING_CAMPAIGN]: () => [
        '/notifications',
      ],

      [NotificationTypeEnum.SYSTEM_ALERT]: () => [
        '/notifications',
      ],
    },

    debug: !conf.isProductionEnv,
  };
}

export function provideAppPushNotification() {
  return provideNotificationWithFactory(
    pushNotificationConfigFactory,
    [ConfService],
  );
}