import { Service } from '@angular/core';
import { Capacitor, CapacitorCookies } from '@capacitor/core';
import {
  ClearCookieOptionsType,
  CookieMapType,
  CookieUrlOptionsType,
  DeleteCookieOptionsType,
  SetCookieOptionsType,
} from './type';

@Service()
export class CookieService {
  private readonly pslug = 'ack';

  constructor() {}

  private get prefix(): string {
    return `${this.pslug}.${this.group}.`;
  }

  protected get group(): string {
    return Capacitor.getPlatform();
  }

  /**
   * If you need full cookie attributes like HttpOnly, SameSite=None, Secure, Domain, Path, expiry precision, etc.,
   * set them from your backend using normal Set-Cookie response headers, not from Capacitor JS/ Frontend client side.
   * HttpOnly in particular cannot be meaningfully set from client-side JavaScript anyway, because that would defeat the entire point.
   *
   * Capacitor does not give you all cookie options on the JS side. That limitation is normal.
   * The full, authoritative cookie setup should usually happen on the server.
   */
  public async set(cookie: SetCookieOptionsType): Promise<void> {
    const normalizedCookie = this.normalizeSetCookieOptions(cookie);
    await CapacitorCookies.setCookie(normalizedCookie);
  }

  public async get(name: string, options?: CookieUrlOptionsType): Promise<string | null> {
    const key = this.normalizeKey(name);
    if (!key) {
      return null;
    }

    const getOptions = this.normalizeCookieUrlOptions(options);
    const cookies = await CapacitorCookies.getCookies(getOptions);
    return cookies[key] ?? null;
  }

  public async getAll(options?: CookieUrlOptionsType): Promise<CookieMapType> {
    const getOptions = this.normalizeCookieUrlOptions(options);
    const cookies = await CapacitorCookies.getCookies(getOptions);
    const normalizedCookies: CookieMapType = {};

    for (const [key, value] of Object.entries(cookies)) {
      if (key.startsWith(this.prefix)) {
        normalizedCookies[key.slice(this.prefix.length)] = value;
      }
    }

    return normalizedCookies;
  }

  public async has(name: string, options?: CookieUrlOptionsType): Promise<boolean> {
    const value = await this.get(name, options);
    return value !== null;
  }

  public async delete(name: string, options?: CookieUrlOptionsType): Promise<void> {
    const key = this.normalizeKey(name);
    if (!key) {
      return;
    }

    const deleteOptions = this.normalizeDeleteCookieOptions(key, options?.url);
    await CapacitorCookies.deleteCookie(deleteOptions);
  }

  public async clear(options?: ClearCookieOptionsType): Promise<void> {
    const getOptions = this.normalizeCookieUrlOptions(options);
    const cookies = await CapacitorCookies.getCookies(getOptions);

    for (const key of Object.keys(cookies)) {
      if (key.startsWith(this.prefix)) {
        const deleteOptions = this.normalizeDeleteCookieOptions(key, options?.url);
        await CapacitorCookies.deleteCookie(deleteOptions);
      }
    }
  }

  public async clearAllCookies(): Promise<void> {
    await CapacitorCookies.clearAllCookies();
  }

  private normalizeSetCookieOptions(cookie: SetCookieOptionsType): SetCookieOptionsType {
    const key = this.normalizeKey(cookie.key);
    if (!key) {
      throw new Error('Cookie key is required.');
    }

    const normalizedValue = cookie.value ?? '';
    const normalizedUrl = this.normalizeUrl(cookie.url);
    const normalizedPath = cookie.path?.trim() || undefined;
    const normalizedExpires = cookie.expires?.trim() || undefined;

    return {
      ...cookie,
      key,
      value: normalizedValue,
      url: normalizedUrl,
      path: normalizedPath,
      expires: normalizedExpires,
    };
  }

  private normalizeDeleteCookieOptions(key: string, url?: string): DeleteCookieOptionsType {
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) {
      return { key };
    }

    return {
      key,
      url: normalizedUrl,
    };
  }

  private normalizeCookieUrlOptions(
    options?: CookieUrlOptionsType,
  ): CookieUrlOptionsType | undefined {
    const normalizedUrl = this.normalizeUrl(options?.url);
    if (!normalizedUrl) {
      return undefined;
    }

    return { url: normalizedUrl };
  }

  private normalizeKey(key: string): string {
    const normalizedKey = key?.trim() ?? '';
    if (!normalizedKey) {
      return '';
    }

    if (normalizedKey.startsWith(this.prefix)) {
      return normalizedKey;
    }

    return `${this.prefix}${normalizedKey}`;
  }

  private normalizeUrl(url?: string): string | undefined {
    const normalizedUrl = url?.trim();
    const resolvedUrl = normalizedUrl || this.resolveRuntimeUrl();

    if (!resolvedUrl) {
      return undefined;
    }

    // Capacitor web adapter writes this value as cookie "domain", so passing
    // full URLs (e.g. http://localhost:4200) causes the browser to drop cookie.
    // On web we skip url/domain and let browser set a host-only cookie.
    if (this.isWebPlatform()) {
      return undefined;
    }

    return resolvedUrl;
  }

  private resolveRuntimeUrl(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const windowUrl = window?.location?.origin || window?.location?.href;
    const normalizedWindowUrl = windowUrl?.trim();
    return normalizedWindowUrl || undefined;
  }

  private isWebPlatform(): boolean {
    return Capacitor.getPlatform() === 'web';
  }
}
