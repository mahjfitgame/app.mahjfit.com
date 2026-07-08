// file: libs/src/notification/state.ts

import { computed, Injectable, signal } from '@angular/core';

import { NotificationProviderEnum } from './enum';
import { NotificationInboxItem } from './model';

@Injectable({ providedIn: 'root' })
export class NotificationState {
  private readonly userIdStore = signal<number | null>(null);
  public readonly userId = this.userIdStore.asReadonly();

  private readonly userDeviceIdStore = signal<number | null>(null);
  public readonly udvcId = this.userDeviceIdStore.asReadonly();

  private readonly providerStore = signal<NotificationProviderEnum | null>(null);
  public readonly provider = this.providerStore.asReadonly();

  private readonly providerDeviceIdStore = signal<string | null>(null);
  public readonly providerDeviceId = this.providerDeviceIdStore.asReadonly();

  private readonly inboxStore = signal<NotificationInboxItem[]>([]);
  public readonly inbox = this.inboxStore.asReadonly();

  private readonly inboxTotalStore = signal<number>(0);
  public readonly inboxTotal = this.inboxTotalStore.asReadonly();

  private readonly initializedStore = signal<boolean>(false);
  public readonly initialized = this.initializedStore.asReadonly();

  private readonly permissionGrantedStore = signal<boolean>(false);
  public readonly permissionGranted = this.permissionGrantedStore.asReadonly();

  public readonly unreadCount = computed(() => {
    const items = this.inboxStore();

    let count = 0;
    let i = 0;

    while (i < items.length) {
      if (!items[i].read_at) {
        count++;
      }

      i++;
    }

    return count;
  });

  public setUserId(userId: number | null): void {
    this.userIdStore.set(userId);
  }

  public setUserDeviceId(udvcId: number | null): void {
    this.userDeviceIdStore.set(udvcId);
  }

  public setProvider(provider: NotificationProviderEnum | null): void {
    this.providerStore.set(provider);
  }

  public setProviderDeviceId(providerDeviceId: string | null): void {
    this.providerDeviceIdStore.set(providerDeviceId);
  }

  public setInbox(items: NotificationInboxItem[], total: number): void {
    this.inboxStore.set(items);
    this.inboxTotalStore.set(total);
  }

  public setInitialized(value: boolean): void {
    this.initializedStore.set(value);
  }

  public setPermissionGranted(value: boolean): void {
    this.permissionGrantedStore.set(value);
  }

  public reset(): void {
    this.userIdStore.set(null);
    this.providerStore.set(null);
    this.providerDeviceIdStore.set(null);
    this.inboxStore.set([]);
    this.inboxTotalStore.set(0);
    this.initializedStore.set(false);
    this.permissionGrantedStore.set(false);
  }
}