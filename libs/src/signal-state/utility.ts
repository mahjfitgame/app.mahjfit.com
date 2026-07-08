// file: libs/src/signal-state/utility.ts
import { Service } from '@angular/core';
import { SignalStateScopeType, SignalStateStorageEnvelopeType } from './type';
import { SIGNAL_STATE_STORAGE_PREFIX } from './const';

@Service()
export class SignalStateUtility {
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
