// file: src/app/base/internationalization/service.ts

import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TranslocoService } from '@jsverse/transloco';

import { catchError, filter, forkJoin, interval, map, Observable, of, switchMap, take } from 'rxjs';

import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';

import {
    I18N_ALLOWED_LANG,
    I18N_DEFAULT_LANG,
    I18N_GLOBAL_KEY,
    I18N_KEY,
    I18N_RTL_LANG,
    I18N_RUNTIME_DIR,
    I18N_SERVER_MODULE_ENDPOINT,
    I18N_USE_API
} from '@base/internationalization/const';

import { I18nBidiEnum, I18nLanguageEnum } from '@base/internationalization/enum';
import { I18nRegistry, I18nRegistryItem, I18nTranslationObject, I18nLanguageOption } from '@base/internationalization/type';
import { I18nState } from '@base/internationalization/state';

@Service()
export class I18nService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly http = inject(HttpClient);
    private readonly transloco = inject(TranslocoService);

    public readonly state = inject(I18nState);

    private readonly useApi: boolean = I18N_USE_API;

    private readonly loadedModules = new Set<string>();
    private readonly requestedModules = new Set<string>();

    public readonly languages: I18nLanguageOption[] = [
        {
            code: I18nLanguageEnum.EN,
            label: 'English',
            nativeLabel: 'English',
            bidi: I18nBidiEnum.LTR
        },
        {
            code: I18nLanguageEnum.HI,
            label: 'Hindi',
            nativeLabel: 'हिन्दी',
            bidi: I18nBidiEnum.LTR
        },
        {
            code: I18nLanguageEnum.GU,
            label: 'Gujarati',
            nativeLabel: 'ગુજરાતી',
            bidi: I18nBidiEnum.LTR
        },
        {
            code: I18nLanguageEnum.ES,
            label: 'Spanish',
            nativeLabel: 'Español',
            bidi: I18nBidiEnum.LTR
        },
        {
            code: I18nLanguageEnum.FR,
            label: 'French',
            nativeLabel: 'Français',
            bidi: I18nBidiEnum.LTR
        },
        {
            code: I18nLanguageEnum.AR,
            label: 'Arabic',
            nativeLabel: 'العربية',
            bidi: I18nBidiEnum.RTL
        }
    ];

    /**
     * Loads this module's OWN bundle, the language switcher labels.
     *
     * THE ONE EXCEPTION to the rule documented on useModule() below: this call
     * stays in InternationalizationComponent.ngOnInit() and is NOT moved into a
     * constructor. I18nService is @Service() - an app-root singleton - so its
     * constructor fires once, on first injection from anywhere in the app, at a
     * moment that has nothing to do with the component that renders the switcher.
     * Every other initI18n() in the app belongs in its service constructor.
     */
    public initI18n(): void {
        this.useModule(I18N_KEY);
    }
    public init(): Observable<boolean> {
        this.transloco.setAvailableLangs(I18N_ALLOWED_LANG);
        this.transloco.setDefaultLang(I18N_DEFAULT_LANG);

        return this.waitForPersistedState$().pipe(
            switchMap(() => {
                const lang = this.currentLang();

                return this.use$(lang).pipe(
                    switchMap(() => this.loadModule(I18N_GLOBAL_KEY))
                );
            })
        );
    }

    public use(lang: I18nLanguageEnum): void {
        this.use$(lang).subscribe();
    }

    public use$(lang: I18nLanguageEnum): Observable<boolean> {
        const safeLang = this.safeLang(lang);
        const bidi = this.getBidiByLang(safeLang);

        this.state.setLang(safeLang);
        this.state.setBidi(bidi);

        this.loadedModules.clear();

        this.transloco.setActiveLang(safeLang);

        return this.transloco.load(safeLang).pipe(
            map(() => {
                this.reloadRequestedModules();
                return true;
            }),
            catchError((error) => {
                this.log.error?.('Language switch failed', error);
                return of(false);
            })
        );
    }

    public currentLang(): I18nLanguageEnum {
        const stateLang = this.state.lang();

        if (this.isAllowedLang(stateLang)) {
            return stateLang;
        }

        const activeLang = this.transloco.getActiveLang();

        if (this.isAllowedLang(activeLang)) {
            return activeLang;
        }

        return I18nLanguageEnum.EN;
    }

    public translate(key: string, params?: Record<string, unknown>): string {
        return this.transloco.translate(key, params);
    }

    public selectTranslate(
        key: string,
        params?: Record<string, unknown>
    ): Observable<string> {
        return this.transloco.selectTranslate(key, params);
    }

    public loadModule(moduleKey: string): Observable<boolean> {
        this.requestedModules.add(moduleKey);

        const lang = this.currentLang();
        const loadedKey = `${moduleKey}:${lang}`;

        if (this.loadedModules.has(loadedKey)) {
            return of(true);
        }

        return this.loadRegistry().pipe(
            map((registry) => {
                return registry.items.find((item) => item.key === moduleKey);
            }),
            switchMap((item) => {
                if (!item) {
                    this.log.warn?.(`i18n module not found in registry: ${moduleKey}`);
                    return of(false);
                }

                return this.loadModuleByItem$(item, lang, loadedKey);
            }),
            catchError((error) => {
                this.log.error?.('i18n registry load failed', error);
                return of(false);
            })
        );
    }
    /**
     * The entry point every module uses to pull its own translation bundle in,
     * always through that module's initI18n().
     *
     * ▬▬ WHERE initI18n() MUST BE CALLED ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
     * From the module SERVICE CONSTRUCTOR, never from the component's ngOnInit.
     *
     * 1. Module services are component-scoped: @Service({ autoProvided: false })
     *    plus the module's own <MODULE>_PROVIDER array sitting in the component's
     *    `providers`. The instance is therefore created during component
     *    construction and dies with the component, which makes the constructor a
     *    lifecycle hook in its own right - one tick earlier than ngOnInit, with
     *    the exact same lifetime. The usual "constructors must be side-effect
     *    free" rule guards against root singletons doing work at an unpredictable
     *    time; that hazard does not exist for a component-scoped service.
     *
     * 2. setModuleInfo() runs in that same constructor and publishes i18n keys
     *    ('<MODULE>.MODULE.TITLE' / '.HINT') into the layout state. Kicking the
     *    bundle fetch off first shrinks the window in which the layout renders
     *    raw keys, and lets the translation load run in parallel with the
     *    module's initial data load instead of after it.
     *
     * 3. initI18n() is declared in FoundationModuleServiceType right next to
     *    setModuleInfo() and alterBreadcrumb(), both of which are already called
     *    from the constructor. Leaving only this one to the component meant every
     *    new module had to remember an extra line, and forgetting it failed
     *    silently - untranslated keys on screen, no error anywhere.
     *
     * 4. Calling it at construction is enough for the component's whole life.
     *    loadModule() caches on `${moduleKey}:${lang}` in loadedModules, and
     *    registers the key in requestedModules so reloadRequestedModules()
     *    replays it on every language switch. The subscribe below is
     *    fire-and-forget, so it never blocks construction either.
     *
     * The single exception is I18nService.initI18n() itself - see the note there.
     */
    public useModule(moduleKey: string): void {
        this.loadModule(moduleKey).subscribe({
            error: (error) => {
                this.log.error?.(`i18n module use failed: ${moduleKey}`, error);
            }
        });
    }

    public reloadCurrentLanguage(): void {
        const lang = this.currentLang();

        this.loadedModules.clear();

        this.transloco.load(lang).pipe(
            switchMap(() => this.use$(lang))
        ).subscribe({
            error: (error) => {
                this.log.error?.('i18n reload failed', error);
            }
        });
    }

    public translateModule(
        moduleKey: string,
        translationKey: string,
        params?: Record<string, unknown>
    ): Observable<string> {
        return this.loadModule(moduleKey).pipe(
            map(() => {
                return this.translate(translationKey, params);
            })
        );
    }

    public selectTranslateModule(
        moduleKey: string,
        translationKey: string,
        params?: Record<string, unknown>
    ): Observable<string> {
        return this.loadModule(moduleKey).pipe(
            switchMap(() => {
                return this.selectTranslate(translationKey, params);
            })
        );
    }

    private waitForPersistedState$(): Observable<boolean> {
        if (this.state.ready()) {
            return of(true);
        }

        return interval(10).pipe(
            filter(() => this.state.ready()),
            take(1),
            map(() => true)
        );
    }

    private loadModuleByItem$(
        item: I18nRegistryItem,
        lang: I18nLanguageEnum,
        loadedKey: string
    ): Observable<boolean> {
        const fallbackUrl = `${item.path}/${I18N_DEFAULT_LANG}.json`;
        const langUrl = `${item.path}/${lang}.json`;

        const requests: Observable<I18nTranslationObject>[] = [
            this.http.get<I18nTranslationObject>(fallbackUrl).pipe(
                catchError(() => of({}))
            ),
            this.http.get<I18nTranslationObject>(langUrl).pipe(
                catchError(() => of({}))
            )
        ];

        if (this.useApi) {
            const backendModuleUrl = `${this.conf.bfwApiSdkRestUrl}/${I18N_SERVER_MODULE_ENDPOINT}/${lang}/${item.key}`;

            requests.push(
                this.http.get<I18nTranslationObject>(backendModuleUrl).pipe(
                    catchError(() => of({}))
                )
            );
        }

        return forkJoin(requests).pipe(
            map((translations) => {
                const merged = this.deepMerge(...translations);

                /**
                 * merge: true keeps existing global translations and adds/overrides
                 * module-specific translations.
                 */
                this.transloco.setTranslation(merged, lang, {
                    merge: true
                });

                this.loadedModules.add(loadedKey);

                return true;
            }),
            catchError((error) => {
                this.log.error?.(`i18n module load failed: ${item.key}`, error);
                return of(false);
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

    private reloadRequestedModules(): void {
        this.requestedModules.forEach((moduleKey) => {
            this.loadModule(moduleKey).subscribe({
                error: (error) => {
                    this.log.error?.(`i18n module reload failed: ${moduleKey}`, error);
                }
            });
        });
    }

    private safeLang(lang: string): I18nLanguageEnum {
        if (this.isAllowedLang(lang)) {
            return lang;
        }

        return I18nLanguageEnum.EN;
    }

    private isAllowedLang(lang: unknown): lang is I18nLanguageEnum {
        return typeof lang === 'string' && I18N_ALLOWED_LANG.includes(lang);
    }

    private getBidiByLang(lang: I18nLanguageEnum): I18nBidiEnum {
        return I18N_RTL_LANG.includes(lang)
            ? I18nBidiEnum.RTL
            : I18nBidiEnum.LTR;
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