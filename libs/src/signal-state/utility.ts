// file: libs/src/signal-state/utility.ts
import { Service, inject } from '@angular/core';
import { SignatureService } from '../signature/service';
import {
  SignalStateScopeType,
  SignalStateStorageEnvelopeType,
  SignalStateStorageValueType,
} from './type';
import { SIGNAL_STATE_STORAGE_PREFIX } from './const';

@Service()
export class SignalStateUtility {
  /**
   * Keeps the signature dependency used to encrypt and decrypt envelope payloads.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly signature = inject(SignatureService);

  /**
   * Handles the buildStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string {
    const storeSegment = this.normalizeSegment(store, 'store');
    const fieldSegment = this.normalizeSegment(field, 'field');

    if (!scope) {
      return [SIGNAL_STATE_STORAGE_PREFIX, storeSegment, fieldSegment].join('.');
    }

    return [
      SIGNAL_STATE_STORAGE_PREFIX,
      this.normalizeSegment(scope.type, 'scope type'),
      this.normalizeSegment(scope.id, 'scope ID'),
      storeSegment,
      fieldSegment,
    ].join('.');
  }

  /**
   * Handles the normalizeSegment operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public normalizeSegment(value: string, description: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new Error(`Signal-state ${description} is required.`);
    }

    return encodeURIComponent(normalized);
  }

  /**
   * Handles the normalizeValue operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public normalizeValue(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  /**
   * Handles the normalizeStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public normalizeStorageKey(key: string): string {
    const normalizedKey = key?.trim();
    if (!normalizedKey) {
      throw new Error('Signal-state storage key is required.');
    }

    return normalizedKey;
  }

  /**
   * Handles the maybeNormalizeStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public maybeNormalizeStorageKey(key: string): string | null {
    const normalizedKey = key?.trim();
    return normalizedKey || null;
  }

  /**
   * Handles the assertSerializable operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public assertSerializable(value: unknown): void {
    if (JSON.stringify(value) === undefined) {
      throw new Error('Persisted signal value must be JSON serializable.');
    }
  }

  /**
   * Builds the record written to storage for one save.
   * Plain fields keep the raw value, every other field is encrypted inside a versioned envelope.
   */
  public buildRecord<T>(state: T, version: number, plainValue: boolean): SignalStateStorageEnvelopeType | T {
    this.assertSerializable(state);

    if (plainValue) {
      return state;
    }

    return {
      v: version,
      u: new Date().toISOString(),
      s: this.signature.encryptJson(state),
    };
  }

  /**
   * Reads a stored record written by buildRecord().
   * An envelope is version checked and decrypted, anything else is taken as a plain raw value,
   * so a field keeps loading correctly after its plainValue option is switched.
   */
  public readRecord<T>(stored: unknown, expectedVersion: number): SignalStateStorageValueType<T> | null {
    const parsed = typeof stored === 'string' ? this.parseEnvelope(stored as string) : stored;

    if (this.isStorageEnvelope(parsed)) {
      if (parsed.v !== expectedVersion) {
        return null;
      }

      return {
        v: parsed.v,
        u: parsed.u,
        s: this.signature.decryptJson<T>(parsed.s),
      };
    }

    return {
      v: expectedVersion,
      u: new Date().toISOString(),
      s: (parsed ?? stored) as T,
    };
  }

  /**
   * Parses a stored envelope that may already be an object or may be JSON text.
   * Invalid JSON returns null so callers can safely ignore broken stored data.
   */
  public parseEnvelope<TEnvelope extends SignalStateStorageEnvelopeType>(
    value: TEnvelope | string,
  ): TEnvelope | null {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value) as TEnvelope;
    } catch {
      return null;
    }
  }

  /**
   * Handles the isStorageEnvelope operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public isStorageEnvelope(value: unknown): value is SignalStateStorageEnvelopeType {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<SignalStateStorageEnvelopeType>;
    return (
      typeof candidate.v === 'number' &&
      typeof candidate.u === 'string' &&
      typeof candidate.s === 'string'
    );
  }
}
