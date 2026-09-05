// file: src/app/base/notify/service.ts
import { Service, Type, inject } from '@angular/core';
import { GlobalConfig, IndividualConfig, ToastrService } from 'ngx-toastr';
import { NotifyTypeEnum } from '@base/notify/enum';
import { BreakpointObserverService } from '@libs/breakpoint/service';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { I18nBidiEnum } from '@base/internationalization/enum';
import { NotifyOptions, NotifyPayload } from '@base/notify/type';
import { NotifyComponent } from '@base/notify/component';
import { I18nService } from '@base/internationalization/service';

@Service()
export class NotifyService {
    private readonly toastr = inject(ToastrService);

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private i18n = inject(I18nService);
    private bos = inject(BreakpointObserverService)

    private getPosition(): string {
        if(this.bos.isSmAndDown()) {
            return 'toast-top-full-width'
        } else {
            return this.i18n.state.bidi() === I18nBidiEnum.RTL ? 'toast-top-left' : 'toast-top-right';
        }
    }
    private getDefaultOptions(options?: NotifyOptions): Partial<IndividualConfig> {
        // assign values from this.conf env set values
        const defConf: Partial<GlobalConfig> = {
            timeOut: 20 * 1000,
            extendedTimeOut: 2 * 1000,
            positionClass: this.getPosition(),
            closeButton: true,
            progressBar: true,
            progressAnimation: 'increasing',
            preventDuplicates: true,
            countDuplicates: true,
            enableHtml: true,
            newestOnTop: true,
            tapToDismiss: false,
            resetTimeoutOnDuplicate: true,
            toastComponent: NotifyComponent as Type<unknown>            
        };

        return {
            ...defConf,
            ...options,
        };
    }
    public success(
        message: string,
        title = 'Success',
        options?: NotifyOptions,
    ): void {
        this.toastr.success(message, title, this.getDefaultOptions(options));
    }
    public error(
        message: string,
        title?:  string,
        options?: NotifyOptions,
    ): void {
        this.toastr.error(message, title, this.getDefaultOptions(options));
    }
    public warning(
        message: string,
        title?: string,
        options?: NotifyOptions,
    ): void {
        this.toastr.warning(message, title, this.getDefaultOptions(options));
    }
    public info(
        message: string,
        title?: string,
        options?: NotifyOptions,
    ): void {
        this.toastr.info(message, title, this.getDefaultOptions(options));
    }
    public show(payload: NotifyPayload): void {
        const type = payload.type ?? NotifyTypeEnum.INFO;
        const opt = this.getDefaultOptions(payload.options);

        switch (type) {
            case NotifyTypeEnum.SUCCESS:
                this.success(payload.message, payload.title, opt);
                return;

            case NotifyTypeEnum.ERROR:
                this.error(payload.message, payload.title, opt);
                return;

            case NotifyTypeEnum.WARNING:
                this.warning(payload.message, payload.title, opt);
                return;

            case NotifyTypeEnum.INFO:
            default:
                this.info(payload.message, payload.title, opt);
                return;
        }
    }
    public clear(): void {
        this.toastr.clear();
    }
}