import { inject, Service } from '@angular/core';
import { ConfService } from '@libs/conf/service';

@Service()
export class SignatureService {
  private readonly pslug = 'enc';
  private readonly version: number = 1;

  private readonly conf = inject(ConfService);

  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  private static readonly k = 3854261;

  private secret = '';
  private secretBytes = new Uint8Array(0);

  constructor() {
    this.setSecret(this.conf.commonSecret);
  }

  private get prefix(): string {
    return `${this.pslug}.v${this.version}.`;
  }

  public avtar(drawText: string, opt?: {width?: number, height?: number, font: string}): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';

    canvas.width = opt?.width || 240;
    canvas.height = opt?.height || 60;

    ctx.textBaseline = "top";
    ctx.font = opt?.font || "16px 'Arial', 'Helvetica', sans-serif";
    ctx.fillStyle = "#069";
    ctx.fillText(drawText, 5, 5);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255, 0, 0, 0.5)");
    gradient.addColorStop(1, "rgba(0, 0, 255, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 30, 200, 20);

    return canvas.toDataURL();
  }

  public setSecret(secret?: string): void {
    this.secret = secret?.trim() ?? '';
    this.secretBytes = this.secret
      ? this.encoder.encode(this.secret)
      : new Uint8Array(0);
  }

  public isReady(): boolean {
    return this.secretBytes.length > 0;
  }

  public toBase64(value: string): string {
    const bytes = this.encoder.encode(value);
    return btoa(this.bytesToBinary(bytes));
  }

  public fromBase64(value: string): string {
    const binary = atob(value);
    const bytes = this.binaryToBytes(binary);
    return this.decoder.decode(bytes);
  }

  public encryptToken(value: string): string {
    this.assertReady();

    const plainBytes = this.encoder.encode(value);
    const encryptedBytes = this.xorBytes(plainBytes);

    return `${this.prefix}${btoa(this.bytesToBinary(encryptedBytes))}`;
    }

  public decryptToken(value: string): string {
    
    this.assertReady();

    const token = value?.trim() ?? '';

    if (!token.startsWith(this.prefix)) {
        throw new Error('Unsupported encrypted token format.');
    }

    const payload = token.slice(this.prefix.length);
    const encryptedBytes = this.binaryToBytes(atob(payload));
    const plainBytes = this.xorBytes(encryptedBytes);

    return this.decoder.decode(plainBytes);
  }

  public encryptJson<T>(value: T): string {
    return this.encryptToken(JSON.stringify(value));
  }

  public decryptJson<T>(value: string): T {
    return JSON.parse(this.decryptToken(value)) as T;
  }

  private assertReady(): void {
    if (!this.secretBytes.length) {
      throw new Error('SignatureService secret is not configured.');
    }
  }

  private xorBytes(input: Uint8Array): Uint8Array {
    const output = new Uint8Array(input.length);
    const secret = this.secretBytes;
    const secretLength = secret.length;

    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] ^ secret[i % secretLength];
    }

    return output;
  }

  private bytesToBinary(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return binary;
  }

  private binaryToBytes(binary: string): Uint8Array {
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  // Encrypt: String -> "p02mx7"
  static sme(text: string): string {
    return btoa(
      text
        .split('')
        .map(char => String.fromCharCode(char.charCodeAt(0) ^ this.k))
        .join('')
    )
    .replace(/\+/g, '-') // Make URL safe
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove padding
  }

  // Decrypt: "p02mx7" -> String
  static smd(encoded: string): string {
    // Add padding back for btoa
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const decoded = atob(base64);
    return decoded
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) ^ this.k))
      .join('');
  }

  private toHex(bytes: Uint8Array): string {
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
      output += bytes[i].toString(16).padStart(2, '0');
    }

    return output;
  }
  /**
   * Encryption string must nothave character :
   * as it is used to create stable short alias 
   * : is a signature character to identify a stable short alias
   */
  public createStableShortAlias(value: string): string {
      if(this.isEndStableShortAlias(value)) {
        return value;
      }
      /**
       * cyrb53-style stable 53-bit hash.
       * Returns short deterministic base36 text.
       *
       * Same input => same output.
       */
      let h1 = 0xdeadbeef;
      let h2 = 0x41c6ce57;

      for (let i = 0; i < value.length; i++) {
          const ch = value.charCodeAt(i);

          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
      }

      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
          ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);

      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
          ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

      const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);

      const shortHash = hash.toString(36);

      // Add pattern: insert dot
      //return shortHash.charAt(0) + '.' + shortHash.slice(1); // add dot after 1st char
      return shortHash.slice(0, -1) + '.' + shortHash.slice(-2); // add dot before last 2 char

      // Insert dot at random position
      //const randomPos = Math.floor(Math.random() * (shortHash.length - 1)) + 1;
      //return shortHash.slice(0, randomPos) + '.' + shortHash.slice(randomPos);
  }
  public isStartStableShortAlias(value: string): boolean {
    // Pattern: single char, dot, then rest
    // Example: "a.bcd123xyz"
    return /^[a-z0-9]\"."[a-z0-9]+$/.test(value);
  }
  public isEndStableShortAlias(value: string): boolean {
    // Pattern: chars + dot + single char at end
    // Example: "abc123de.f"
    return /^[a-z0-9]+\.[a-z0-9]{2}$/.test(value);
  }
  public isRandStableShortAlias(value: string): boolean {
    // Simple check: if contains dot, it's already hashed
    return value.includes('.');
  }
}