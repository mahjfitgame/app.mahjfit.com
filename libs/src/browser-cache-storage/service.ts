import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { PlatformType } from '@libs/platform/type';
import type { BrowserCacheStorageSetOptionsType } from './type';

@Service()
export class BrowserCacheStorageService {
  private readonly pslug = 'acs';
  private readonly keyOrigin = 'https://browser-cache-storage.invalid';
  private cachePromise?: Promise<Cache>;

  protected get group(): PlatformType {
    // Avoid injecting AppPlatformService because storage can be used by services
    // that AppPlatformService depends on.
    return Capacitor.getPlatform() as PlatformType;
  }

  protected get cacheStorage(): CacheStorage {
    const cacheStorage = globalThis.caches;

    if (!cacheStorage) {
      throw new Error('The browser Cache Storage API is not available.');
    }

    return cacheStorage;
  }

  private get cacheName(): string {
    return `${this.pslug}.${this.group}`;
  }

  public async set<T>(
    key: string,
    value: T,
    options: BrowserCacheStorageSetOptionsType = {},
  ): Promise<void> {
    const body = JSON.stringify(value);

    if (body === undefined) {
      throw new TypeError('Browser cache values must be JSON serializable.');
    }

    const headers = new Headers(options.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }

    await this.setResponse(
      key,
      new Response(body, {
        headers,
        status: options.status,
        statusText: options.statusText,
      }),
    );
  }

  public async get<T>(key: string): Promise<T | null> {
    const response = await this.getResponse(key);
    return response ? (response.json() as Promise<T>) : null;
  }

  public async getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value ?? defaultValue;
  }

  public async setResponse(key: string, response: Response): Promise<void> {
    const cache = await this.openCache();
    await cache.put(this.normalizeKey(key), response.clone());
  }

  public async getResponse(key: string): Promise<Response | null> {
    const cache = await this.openCache();
    return (await cache.match(this.normalizeKey(key))) ?? null;
  }

  public async has(key: string): Promise<boolean> {
    return (await this.getResponse(key)) !== null;
  }

  public async remove(key: string): Promise<boolean> {
    const cache = await this.openCache();
    return cache.delete(this.normalizeKey(key));
  }

  public async clear(): Promise<void> {
    await this.cacheStorage.delete(this.cacheName);
    this.cachePromise = undefined;
  }

  public async keys(): Promise<string[]> {
    const cache = await this.openCache();
    const requests = await cache.keys();
    const keyPrefix = this.keyPrefix;

    return requests
      .map((request) => request.url)
      .filter((url) => url.startsWith(keyPrefix))
      .map((url) => decodeURIComponent(url.slice(keyPrefix.length)));
  }

  private get keyPrefix(): string {
    return `${this.keyOrigin}/${encodeURIComponent(this.cacheName)}/`;
  }

  private normalizeKey(key: string): string {
    return `${this.keyPrefix}${encodeURIComponent(key?.trim())}`;
  }

  private openCache(): Promise<Cache> {
    this.cachePromise ??= this.cacheStorage.open(this.cacheName);
    return this.cachePromise;
  }
}
