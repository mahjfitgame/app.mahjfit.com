// file: ./src/app/base/internationalization/loader.ts

import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TranslocoLoader, Translation } from '@jsverse/transloco';

import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';

import { I18nRegistry, I18nRegistryItem, I18nTranslationObject } from '@base/internationalization/type';
import {
    I18N_ALLOWED_LANG,
    I18N_DEFAULT_LANG,
    I18N_RUNTIME_DIR,
    I18N_SERVER_GLOBAL_ENDPOINT,
    I18N_USE_API
} from '@base/internationalization/const';

@Service()
export class I18nLoader implements TranslocoLoader {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly http = inject(HttpClient);

    private readonly useApi: boolean = I18N_USE_API;

    public getTranslation(lang: string): Observable<Translation> {
        const safeLang = this.safeLang(lang);

        return this.loadRegistry().pipe(
            switchMap((registry) => {
                const globalItems = registry.items.filter((item) => item.global);

                const requests: Observable<I18nTranslationObject>[] = globalItems.map((item) => {
                    return this.loadItemTranslation(item, safeLang);
                });

                if (this.useApi) {
                    const backendUrl = `${this.conf.bfwApiSdkRestUrl}/${I18N_SERVER_GLOBAL_ENDPOINT}/${safeLang}`;

                    requests.push(
                        this.http.get<I18nTranslationObject>(backendUrl).pipe(
                            catchError(() => of({}))
                        )
                    );
                }

                if (requests.length === 0) {
                    return of([]);
                }

                return forkJoin(requests);
            }),
            map((translations) => {
                return this.deepMerge(...translations);
            }),
            catchError((error) => {
                this.log.error?.('I18nLoader failed', error);
                return of({});
            })
        );
    }

    private loadRegistry(): Observable<I18nRegistry> {
        return this.http.get<I18nRegistry>(`/${I18N_RUNTIME_DIR}/registry.json`).pipe(
            catchError(() => {
                return of({
                    generated_at: '',
                    items: []
                });
            })
        );
    }

    private loadItemTranslation(
        item: I18nRegistryItem,
        lang: string
    ): Observable<I18nTranslationObject> {
        const fallbackUrl = `${item.path}/${I18N_DEFAULT_LANG}.json`;
        const langUrl = `${item.path}/${lang}.json`;

        if (lang === I18N_DEFAULT_LANG) {
            return this.http.get<I18nTranslationObject>(fallbackUrl).pipe(
                catchError(() => of({}))
            );
        }

        return forkJoin({
            fallback: this.http.get<I18nTranslationObject>(fallbackUrl).pipe(
                catchError(() => of({}))
            ),
            current: this.http.get<I18nTranslationObject>(langUrl).pipe(
                catchError(() => of({}))
            )
        }).pipe(
            map(({ fallback, current }) => {
                return this.deepMerge(fallback, current);
            })
        );
    }

    private safeLang(lang: string): string {
        return I18N_ALLOWED_LANG.includes(lang)
            ? lang
            : I18N_DEFAULT_LANG;
    }

    private deepMerge(...objects: I18nTranslationObject[]): I18nTranslationObject {
        const output: I18nTranslationObject = {};

        let objIndex = 0;
        const objLen = objects.length;

        while (objIndex < objLen) {
            const source = objects[objIndex];
            objIndex++;

            this.mergeInto(output, source);
        }

        return output;
    }

    private mergeInto(target: I18nTranslationObject, source: I18nTranslationObject): void {
        if (!source || typeof source !== 'object') {
            return;
        }

        const keys = Object.keys(source);

        let index = 0;
        const len = keys.length;

        while (index < len) {
            const key = keys[index];
            index++;

            const sourceValue = source[key];
            const targetValue = target[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue)
            ) {
                target[key] = this.isPlainObject(targetValue)
                    ? targetValue
                    : {};

                this.mergeInto(target[key], sourceValue);
            } else {
                target[key] = sourceValue;
            }
        }
    }

    private isPlainObject(value: unknown): value is I18nTranslationObject {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }
}