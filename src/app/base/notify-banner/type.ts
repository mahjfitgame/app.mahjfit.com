// file: ./src/app/base/notify-banner/type.ts
import { NotifyBannerTypeEnum } from "@base/notify-banner/enum";

export interface NotifyBannerAlertType {
  id: number;
  type: NotifyBannerTypeEnum;
  message: string;
}