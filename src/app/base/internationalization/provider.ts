// file: src/app/base/internationalization/provider.ts
import { inject, isDevMode, provideAppInitializer } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { I18N_ALLOWED_LANG, I18N_DEFAULT_LANG } from '@base/internationalization/const';
import { I18nLoader } from '@base/internationalization/loader';
import { I18nService } from '@base/internationalization/service';

export function provideI18nModule() {
    return [
        provideTransloco({
            config: {
                availableLangs: I18N_ALLOWED_LANG,
                defaultLang: I18N_DEFAULT_LANG,
                fallbackLang: I18N_DEFAULT_LANG,
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
                missingHandler: {
                    logMissingKey: !isDevMode()
                }
            },
            loader: I18nLoader
        }),
        provideAppInitializer(() => {
            const i18n = inject(I18nService);
            return i18n.init();
        })
    ];
}