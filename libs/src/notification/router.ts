// file: libs/src/notification/router.ts

import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { NotificationTypeEnum } from './enum';
import { NotificationConfig } from './model';
import { NOTIFICATION_CONFIG } from './token';

@Injectable({ providedIn: 'root' })
export class NotificationRouter {
  constructor(
    private readonly router: Router,

    @Inject(NOTIFICATION_CONFIG)
    private readonly config: NotificationConfig,
  ) {}

  public async routeByData(data: Record<string, any>): Promise<void> {
    const type = this.resolveType(data);

    if (!type) {
      await this.router.navigate(['/notifications']);
      return;
    }

    const routeFactory = this.config.routes[type];

    if (!routeFactory) {
      await this.router.navigate(['/notifications']);
      return;
    }

    await this.router.navigate(routeFactory(data));
  }

  private resolveType(data: Record<string, any>): NotificationTypeEnum | null {
    const rawType =
      data?.['notification_type'] ||
      data?.['type'] ||
      data?.['notificationType'] ||
      null;

    if (!rawType) {
      return null;
    }

    return String(rawType) as NotificationTypeEnum;
  }
}