// file: libs/src/signal-state/scope.ts
import { Service, inject, signal } from '@angular/core';
import { SignalStateScopeType } from './type';
import { SignalStateUtility } from './utility';

@Service()
export class SignalStateScope {
  /**
   * Keeps the utility dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly utility = inject(SignalStateUtility);

  /**
   * Keeps the scopesStore dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly scopesStore = signal<Readonly<Record<string, string>>>({});

  /**
   * Keeps the scopes dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  public readonly scopes = this.scopesStore.asReadonly();

  /**
   * Handles the setScope operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public setScope(type: string, id: string | number | null | undefined): void {
    const normalizedType = this.utility.normalizeValue(type);
    const normalizedId = this.utility.normalizeValue(id);

    if (!normalizedType) {
      throw new Error('Signal-state scope type is required.');
    }

    this.scopesStore.update((current) => {
      const next = { ...current };

      if (normalizedId) {
        next[normalizedType] = normalizedId;
      } else {
        delete next[normalizedType];
      }

      return next;
    });
  }

  /**
   * Handles the getScope operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public getScope(type: string): SignalStateScopeType | null {
    const normalizedType = this.utility.normalizeValue(type);
    if (!normalizedType) {
      return null;
    }

    const id = this.scopesStore()[normalizedType];
    return id ? { type: normalizedType, id } : null;
  }

  /**
   * Handles the clearScope operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public clearScope(type: string): void {
    const normalizedType = this.utility.normalizeValue(type);
    if (!normalizedType) {
      return;
    }

    this.scopesStore.update((current) => {
      const next = { ...current };
      delete next[normalizedType];
      return next;
    });
  }

  /**
   * Handles the clearAll operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public clearAll(): void {
    this.scopesStore.set({});
  }

  /**
   * Handles the snapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public snapshot(): Readonly<Record<string, string>> {
    return { ...this.scopesStore() };
  }
}
