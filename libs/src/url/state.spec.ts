import { describe, expect, it } from 'vitest';
import { UrlState } from './state';
import { UrlHostInfoType } from './type';

/**
 * parseOrigin() is pure and static, so it is tested directly rather than
 * through the DI graph. It stays private on the class — the cast here is the
 * test reaching in, not an invitation to call it from app code.
 */
const parseOrigin = (
    href: string,
    tldLabelCount?: number,
): Omit<UrlHostInfoType, 'path'> =>
    (UrlState as any).parseOrigin(href, tldLabelCount);

describe('UrlState.parseOrigin', () => {

    describe('tld / subdomain split', () => {
        it.each([
            // href,                              count, tld,        subdomain
            ['https://example.com/',                  1, 'com',      null],
            ['https://app.example.com/',              1, 'com',      'app'],
            ['https://a.b.example.com/',              1, 'com',      'a.b'],
            ['https://example.co.uk/',                2, 'co.uk',    null],
            ['https://app.example.co.uk/',            2, 'co.uk',    'app'],
            ['https://example.com.au/',               2, 'com.au',   null],
            ['https://co.uk/',                        2, null,       null],
            ['http://localhost:4200/',                1, null,       null],
            ['http://127.0.0.1:4200/',                1, null,       null],
            ['http://[::1]:4200/',                    1, null,       null],
        ])('%s (count %i) -> tld %s / subdomain %s', (href, count, tld, subdomain) => {
            const origin = parseOrigin(href as string, count as number);

            expect(origin.tld).toBe(tld);
            expect(origin.subdomain).toBe(subdomain);
        });

        it('defaults tldLabelCount to 1', () => {
            expect(parseOrigin('https://app.example.com/').tld).toBe('com');
        });

        it('clamps a count below 1', () => {
            expect(parseOrigin('https://app.example.com/', 0).tld).toBe('com');
        });

        it('returns null for both when the count swallows the whole host', () => {
            const origin = parseOrigin('https://example.com/', 2);

            expect(origin.tld).toBeNull();
            expect(origin.subdomain).toBeNull();
        });
    });

    describe('host fields', () => {
        it('splits domain (with port) from hostname (without)', () => {
            const origin = parseOrigin('http://localhost:4200/account/geo/country');

            expect(origin.protocol).toBe('http:');
            expect(origin.domain).toBe('localhost:4200');
            expect(origin.hostname).toBe('localhost');
            expect(origin.port).toBe('4200');
        });

        it('nulls an absent port and absent credentials', () => {
            const origin = parseOrigin('https://example.com/');

            expect(origin.port).toBeNull();
            expect(origin.username).toBeNull();
            expect(origin.password).toBeNull();
        });

        it('reads credentials when present', () => {
            const origin = parseOrigin('https://user:secret@example.com/');

            expect(origin.username).toBe('user');
            expect(origin.password).toBe('secret');
        });
    });
});
