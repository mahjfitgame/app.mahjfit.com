import { BrowserCacheStorageService } from './service';

class MemoryCache {
  private readonly responses = new Map<string, Response>();

  public async put(request: RequestInfo | URL, response: Response): Promise<void> {
    this.responses.set(this.urlOf(request), response.clone());
  }

  public async match(request: RequestInfo | URL): Promise<Response | undefined> {
    return this.responses.get(this.urlOf(request))?.clone();
  }

  public async delete(request: RequestInfo | URL): Promise<boolean> {
    return this.responses.delete(this.urlOf(request));
  }

  public async keys(): Promise<ReadonlyArray<Request>> {
    return Array.from(this.responses.keys(), (url) => new Request(url));
  }

  private urlOf(request: RequestInfo | URL): string {
    if (typeof request === 'string') {
      return request;
    }

    return request instanceof URL ? request.href : request.url;
  }
}

class MemoryCacheStorage {
  private readonly cacheByName = new Map<string, MemoryCache>();
  public openCount = 0;

  public async open(cacheName: string): Promise<Cache> {
    this.openCount += 1;
    let cache = this.cacheByName.get(cacheName);

    if (!cache) {
      cache = new MemoryCache();
      this.cacheByName.set(cacheName, cache);
    }

    return cache as unknown as Cache;
  }

  public async delete(cacheName: string): Promise<boolean> {
    return this.cacheByName.delete(cacheName);
  }
}

describe('BrowserCacheStorageService', () => {
  let cacheStorage: MemoryCacheStorage;
  let service: BrowserCacheStorageService;

  beforeEach(() => {
    cacheStorage = new MemoryCacheStorage();
    vi.stubGlobal('caches', cacheStorage);
    service = new BrowserCacheStorageService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores and retrieves strings and structured values', async () => {
    await service.set('message', 'hello');
    await service.set('profile', { id: 7, active: true });

    await expect(service.get<string>('message')).resolves.toBe('hello');
    await expect(service.get('profile')).resolves.toEqual({ id: 7, active: true });
  });

  it('trims keys and supports default values', async () => {
    await service.set('  token  ', 'value');

    await expect(service.get<string>('token')).resolves.toBe('value');
    await expect(service.getOrDefault('missing', 42)).resolves.toBe(42);
  });

  it('stores and retrieves native responses without consuming the input', async () => {
    const response = new Response('asset', {
      headers: { 'content-type': 'text/plain' },
      status: 201,
    });

    await service.setResponse('asset.txt', response);
    const cachedResponse = await service.getResponse('asset.txt');

    expect(response.bodyUsed).toBe(false);
    expect(cachedResponse?.status).toBe(201);
    await expect(cachedResponse?.text()).resolves.toBe('asset');
  });

  it('checks for and removes cached values', async () => {
    await service.set('temporary', 42);

    await expect(service.has('temporary')).resolves.toBe(true);
    await expect(service.remove('temporary')).resolves.toBe(true);
    await expect(service.has('temporary')).resolves.toBe(false);
  });

  it('lists decoded keys and clears only its dedicated cache', async () => {
    await service.set('first key', 1);
    await service.set('path/to/second', 2);

    await expect(service.keys()).resolves.toEqual(['first key', 'path/to/second']);

    await service.clear();

    await expect(service.keys()).resolves.toEqual([]);
  });

  it('opens and reuses the cache once until it is cleared', async () => {
    await service.set('first', 1);
    await service.set('second', 2);
    await service.get('first');

    expect(cacheStorage.openCount).toBe(1);

    await service.clear();
    await service.get('first');

    expect(cacheStorage.openCount).toBe(2);
  });

  it('rejects values that cannot be serialized', async () => {
    await expect(service.set('invalid', undefined)).rejects.toThrow(
      'Browser cache values must be JSON serializable.',
    );
  });
});
