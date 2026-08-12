// file: libs/src/signal-state/local.db.ts
import { Service, inject } from '@angular/core';
import { AppStateRepository } from '@libs/sqlite/module/app-state/repository';
import { SignalStateUtility } from './utility';
import {
  SignalStateLocalDbEnvelopeType,
  SignalStateLocalDbSourceType,
  SignalStateLocalDbValueType,
  SignalStateScopeType,
} from './type';

@Service()
export class SignalStateLocalDb {
  /**
   * Keeps the appStateRepository dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly appStateRepository = inject(AppStateRepository);
  /**
   * Keeps the utility dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly utility = inject(SignalStateUtility);

  /**
   * Handles the buildStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string {
    return this.utility.buildStorageKey(store, field, scope);
  }

  /**
   * Saves a serializable value under the normalized storage key.
   * The value is encrypted inside a versioned envelope before it reaches the backend.
   */
  public async save<T>(
    key: string,
    state: T,
    version = 1,
    source?: SignalStateLocalDbSourceType,
    plainValue = false,
  ): Promise<void> {
    const normalizedKey = this.utility.normalizeStorageKey(key);

    await this.sourceFor(source).setValue(
      normalizedKey,
      this.utility.buildRecord(state, version, plainValue),
    );
  }

  /**
   * Loads and decrypts a value only when the key and version are valid.
   * Invalid, missing, or unreadable data returns null so callers can use defaults safely.
   */
  public async load<T>(
    key: string,
    expectedVersion = 1,
    source?: SignalStateLocalDbSourceType,
  ): Promise<SignalStateLocalDbValueType<T> | null> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return null;
    }

    try {
      const stored = await this.sourceFor(source).getValue<SignalStateLocalDbEnvelopeType | string>(
        normalizedKey,
      );

      // a plain record can be false, 0, or an empty string, only a missing record is null
      if (stored === null || stored === undefined) {
        return null;
      }

      return this.utility.readRecord<T>(stored, expectedVersion);
    } catch {
      return null;
    }
  }

  /**
   * Handles the remove operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async remove(key: string, source?: SignalStateLocalDbSourceType): Promise<void> {
    const normalizedKey = this.utility.maybeNormalizeStorageKey(key);
    if (!normalizedKey) {
      return;
    }

    const persistenceSource = this.sourceFor(source);
    if (!persistenceSource.deleteKey) {
      await persistenceSource.setValue(normalizedKey, null);
      return;
    }

    await persistenceSource.deleteKey(normalizedKey);
  }

  /**
   * Handles the sourceFor operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private sourceFor(source?: SignalStateLocalDbSourceType): SignalStateLocalDbSourceType {
    return source ?? this.appStateRepository;
  }
}
