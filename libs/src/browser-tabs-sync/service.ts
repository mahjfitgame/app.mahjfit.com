// file: libs/src/browser-tabs-sync/service.ts
import { DestroyRef, Service, inject } from '@angular/core';
import { uuidv7 } from 'uuidv7';
import { BrowserTabsSyncServiceMessageType } from './type';

@Service()
export class BrowserTabsSyncService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sourceId = uuidv7();

  /** One shared channel for the application when the browser supports it. */
  private readonly broadcastChannel =
    typeof BroadcastChannel === 'undefined'
      ? undefined
      : new BroadcastChannel('browser-tabs-sync-broadcast-channel');

  constructor() {
    this.destroyRef.onDestroy(() => this.broadcastChannel?.close());
  }

  public sendBroadcast(key: string): void {
    this.broadcastChannel?.postMessage({
      key,
      sourceId: this.sourceId,
    } satisfies BrowserTabsSyncServiceMessageType);
  }

  public listenBroadcast(callback: (message: BrowserTabsSyncServiceMessageType) => void): void {
    if (!this.broadcastChannel) {
      return;
    }

    const onMessage = (event: MessageEvent<BrowserTabsSyncServiceMessageType>) => {
      const message = event.data;

      if (!message?.key || message.sourceId === this.sourceId) {
        return;
      }

      callback(message);
    };

    this.broadcastChannel.addEventListener('message', onMessage);
    this.destroyRef.onDestroy(() => {
      this.broadcastChannel?.removeEventListener('message', onMessage);
    });
  }

  public listenLocalStorage(callback: (event: StorageEvent) => void): void {
    if (typeof window === 'undefined') {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key) {
        callback(event);
      }
    };

    window.addEventListener('storage', onStorage);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('storage', onStorage);
    });
  }

  public matchesLocalStorageKey(eventKey: string | null, key: string): boolean {
    return Boolean(eventKey && (eventKey === key || eventKey.endsWith(`:${key}`)));
  }
}
