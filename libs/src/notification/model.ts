// file: libs/src/notification/model.ts

import {
  NotificationEnvironmentEnum,
  NotificationPlatformEnum,
  NotificationProviderEnum,
  NotificationTypeEnum,
} from './enum';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface NotificationRouteFactory {
  (data: Record<string, any>): any[];
}

export interface NotificationConfig {
  appCode: string;

  environment: NotificationEnvironmentEnum;

  graphqlEndpoint: string;

  /**
   * If false, web adapter becomes inactive.
   * Native mobile push still works.
   */
  enableWebPush: boolean;

  /**
   * Required only when enableWebPush = true.
   */
  web?: {
    firebaseConfig?: FirebaseWebConfig;
    firebaseVapidKey?: string;
    serviceWorkerPath?: string;
  };

  /**
   * Notification type to Angular route mapping.
   */
  routes: Partial<Record<NotificationTypeEnum, NotificationRouteFactory>>;

  /**
   * Optional function for JWT/auth headers.
   */
  getAuthHeaders?: () => Record<string, string>;

  /**
   * Optional debug logging.
   */
  debug?: boolean;
}

/* export interface PushDeviceRegisterInput {
  user_id: number;
  app_code: string;
  platform: NotificationPlatformEnum;
  environment: NotificationEnvironmentEnum;
  provider: NotificationProviderEnum;
  provider_device_id?: string;
  provider_user_id?: string;
} */

  export interface PushDeviceRegisterInput {
    u_id: number;
    udvc_id: number;
    token: string;
    provider: NotificationProviderEnum;
  }

export interface PushDeviceDisableInput {
  user_id: number;
  app_code: string;
  provider: NotificationProviderEnum;
  provider_device_id?: string;
}

export interface NotificationInboxInput {
  user_id: number;
  app_code: string;
  limit?: number;
  offset?: number;
}

export interface NotificationMarkReadInput {
  notification_event_id: string;
  user_id: number;
}

export interface NotificationInboxItem {
  id: string;
  app_code: string;
  user_id: number;

  type: NotificationTypeEnum;

  title: string;
  body: string;

  data: Record<string, any>;

  read_at?: string | null;
  created_at: string;
}

export interface NotificationInboxOutput {
  total: number;
  items: NotificationInboxItem[];
}

export interface PushNotificationAdapter {
  init(): Promise<void>;

  identifyUser(userId: number): Promise<void>;

  requestPermissionAndRegister(): Promise<boolean>;

  logout(): Promise<void>;
}