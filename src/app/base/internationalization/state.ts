// file: app/base/internationalization/state.ts
import { Service, effect, inject } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { I18N_P_STATE_VERSION } from '@base/internationalization/const';
import { I18nBidiEnum, I18nLanguageEnum } from '@base/internationalization/enum';

@Service()
export class I18nState extends SignalStateService {
    private readonly conf = inject(ConfService)
    private readonly log = inject(LogService)

    // required for persisted state
    protected override readonly storeKey = 'i18n';

    private readonly _lang = this.localStoragePersistSignal<I18nLanguageEnum>(
        'lang', 
        I18nLanguageEnum.EN, 
        {
            version: I18N_P_STATE_VERSION,
            crossTab: true,
            validate: this.isLanguage,
        }
    );
    public readonly lang = this._lang.asReadonly();

    private readonly _bidi = this.localStoragePersistSignal<I18nBidiEnum>(
        'bidi', 
        I18nBidiEnum.LTR, 
        {
            version: I18N_P_STATE_VERSION,
            crossTab: true,
            validate: this.isBidi,
        }
    );
    public readonly bidi = this._bidi.asReadonly();

    private readonly attrLang = 'lang';
    private readonly attrBidi = 'dir';

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    protected override onActivate(): void {
        const domEffect = effect(() => {
            const lang = this.lang();
            const bidi = this.bidi();

            if (typeof document === 'undefined') {
                return;
            }

            document.documentElement.setAttribute(this.attrLang, lang);
            document.documentElement.setAttribute(this.attrBidi, bidi);
        });

        this.registerDeactivationCleanup(() => domEffect.destroy());
    }

    public setLang(lang: I18nLanguageEnum): void {
        this._lang.set(lang);
    }

    public setBidi(bidi: I18nBidiEnum): void {
        this._bidi.set(bidi);
    }

    // VALIDATION METHODS
    private isLanguage(value: unknown): value is I18nLanguageEnum {
        return (
            value === I18nLanguageEnum.EN ||
            value === I18nLanguageEnum.HI ||
            value === I18nLanguageEnum.GU ||
            value === I18nLanguageEnum.ES ||
            value === I18nLanguageEnum.FR ||
            value === I18nLanguageEnum.AR
        );
    }

    private isBidi(value: unknown): value is I18nBidiEnum {
        return value === I18nBidiEnum.LTR || value === I18nBidiEnum.RTL;
    }
}