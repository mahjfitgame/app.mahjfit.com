// file: libs/src/notification/adapter/noop-push.ts

import { Injectable } from '@angular/core';
import { PushNotificationAdapter } from '../model';

@Injectable({ providedIn: 'root' })
export class NoopPushAdapter implements PushNotificationAdapter {
  public async init(): Promise<void> {
    // Used when notifications are disabled or unsupported.
  }

  public async identifyUser(_userId: number): Promise<void> {
    // No operation.
  }

  public async requestPermissionAndRegister(): Promise<boolean> {
    return false;
  }

  public async logout(): Promise<void> {
    // No operation.
  }
}