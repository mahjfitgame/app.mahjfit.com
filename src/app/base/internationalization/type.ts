// file: src/app/base/internationalization/type.ts
import { I18nBidiEnum, I18nLanguageEnum } from "@base/internationalization/enum";

export type I18nTranslationObject = Record<string, any>;

export interface I18nRegistryItem {
    key: string;
    source: string;
    path: string;
    langs: string[];
    global: boolean;
}

export interface I18nRegistry {
    generated_at: string;
    items: I18nRegistryItem[];
}

export interface I18nLanguageOption {
    code: I18nLanguageEnum;
    label: string;
    nativeLabel: string;
    bidi: I18nBidiEnum;
}