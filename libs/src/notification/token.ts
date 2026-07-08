// file: libs/src/notification/token.ts

import { InjectionToken } from '@angular/core';
import { NotificationConfig } from './model';

export const NOTIFICATION_CONFIG = new InjectionToken<NotificationConfig>(
  'NOTIFICATION_CONFIG',
);