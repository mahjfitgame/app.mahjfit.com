// file: src/app/base/notify/type.ts
import { IndividualConfig } from 'ngx-toastr';
import { NotifyTypeEnum } from '@base/notify/enum';

export interface NotifyOptions extends Partial<IndividualConfig> {
    title?: string;
}

export interface NotifyPayload {
    message: string;
    title?: string;
    type?: NotifyTypeEnum;
    options?: NotifyOptions;
}
