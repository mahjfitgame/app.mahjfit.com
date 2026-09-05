// file: src/app/base/notify-banner/service.ts
import { inject, Injectable, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { NotifyBannerTypeEnum } from "@base/notify-banner/enum";
import { NotifyBannerAlertType } from "@base/notify-banner/type";
import { NotifyBannerState } from "@base/notify-banner/state";

@Service()
export class NotifyBannerService {
    private currentId = 0;

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    public readonly state = inject(NotifyBannerState);

    public readonly NotifyBannerTypeEnum = NotifyBannerTypeEnum;

    constructor() {}

    private addAlert(type: NotifyBannerTypeEnum, message: string, durationSec: number) {
        const id = this.currentId++;
        const newAlert: NotifyBannerAlertType = { id, type, message };

        // push new alert to stack
        this.state.pushAlert(newAlert);
        
        // setup auto-dismiss if duration is greater than 0
        if (durationSec > 0) {
            setTimeout(() => {
                this.state.removeAlert(id);
            }, durationSec * 1000);
        }
    }
    public success(message: string, durationSec = 30) {
        this.addAlert(NotifyBannerTypeEnum.SUCCESS, message, durationSec);
    }
    public error(message: string, durationSec = 0) { // 0 means it won't auto-dismiss (good for errors)
        this.addAlert(NotifyBannerTypeEnum.ERROR, message, durationSec);
    }
    public warning(message: string, durationSec = 30) {
        this.addAlert(NotifyBannerTypeEnum.WARNING, message, durationSec);
    }
    public info(message: string, durationSec = 30) {
        this.addAlert(NotifyBannerTypeEnum.INFO, message, durationSec);
    }
}