import { SnackBarTypeEnum } from "@base/snack-bar/enum";

export interface SnackBarDataType {
    type: SnackBarTypeEnum;
    message: string;
    action?: string;
}