// file: libs/src/notification/provider.ts

import {
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';

import { NotificationConfig } from './model';
import { NOTIFICATION_CONFIG } from './token';

export function provideNotification(config: NotificationConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NOTIFICATION_CONFIG,
      useValue: config,
    },
  ]);
}

export function provideNotificationWithFactory(
  factory: (...deps: any[]) => NotificationConfig,
  deps: any[],
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NOTIFICATION_CONFIG,
      useFactory: factory,
      deps,
    },
  ]);
}