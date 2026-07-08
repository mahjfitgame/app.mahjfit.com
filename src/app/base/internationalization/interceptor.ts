// file: ./src/app/base/internationalization/interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { I18nService } from '@base/internationalization/service';

export const i18nInterceptor: HttpInterceptorFn = (req, next) => {
    const i18n = inject(I18nService);

    const lang = i18n.currentLang();
    const bidi = i18n.state.bidi();

    const request = req.clone({
        setHeaders: {
            'Accept-Language': lang,
            'x-lang': lang,
            'x-bidi': bidi
        }
    });

    return next(request);
};