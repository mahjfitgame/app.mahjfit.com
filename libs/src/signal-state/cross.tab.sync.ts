// file: libs/src/signal-state/cross.tab.sync.ts
import { Service, inject } from '@angular/core';
import { BrowserTabsSyncService } from '../browser-tabs-sync/service';

/**
 * Callback signature used when another tab reports that a key changed.
 * Listeners reload their own state after this function is called.
 */
type SignalStateCrossTabListener = () => void;

/**
 * Multiplexes signal-state storage-key listeners over the application's shared
 * BrowserTabsSyncService. SignalStateService never manages browser APIs itself.
 */
@Service()
export class SignalStateCrossTabSync {
  /**
   * Keeps the browserTabsSync dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly browserTabsSync = inject(BrowserTabsSyncService);
  /**
   * Keeps the listeners dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly listeners = new Map<string, Set<SignalStateCrossTabListener>>();
  private listening = false;

  /**
   * Handles the listen operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public listen(key: string, listener: SignalStateCrossTabListener): () => void {
    const listenersForKey = this.listeners.get(key) ?? new Set();
    listenersForKey.add(listener);
    this.listeners.set(key, listenersForKey);
    this.startListening();

    return () => {
      listenersForKey.delete(listener);
      if (listenersForKey.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Handles the publish operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public publish(key: string): void {
    this.browserTabsSync.sendBroadcast(key);
  }

  /**
   * Handles the startListening operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private startListening(): void {
    if (this.listening) {
      return;
    }

    this.listening = true;

    this.browserTabsSync.listenBroadcast((message) => {
      this.notify(message.key);
    });

    this.browserTabsSync.listenLocalStorage((event) => {
      for (const key of this.listeners.keys()) {
        if (this.browserTabsSync.matchesLocalStorageKey(event.key, key)) {
          this.notify(key);
        }
      }
    });
  }

  /**
   * Handles the notify operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private notify(key: string): void {
    for (const listener of this.listeners.get(key) ?? []) {
      listener();
    }
  }
}
