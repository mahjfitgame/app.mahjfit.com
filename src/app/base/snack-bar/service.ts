import { inject, Injectable, Service } from "@angular/core";
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "@angular/material/snack-bar";
import { SnackBarComponent } from "@base/snack-bar/component";
import { SnackBarTypeEnum } from "@base/snack-bar/enum";
import { I18nBidiEnum } from "@base/internationalization/enum";
import { I18nService } from "@base/internationalization/service";

@Service()
export class SnackBarService {
    private snackbar = inject(MatSnackBar);
    private i18n = inject(I18nService);

    constructor() {}
    public getHorizontalPosition(): MatSnackBarHorizontalPosition {
        return this.i18n.state.bidi() === I18nBidiEnum.RTL ? 'start' : 'end';
    }
    public getVerticalPosition(): MatSnackBarVerticalPosition {
        return 'top';
    }
    public success(message: string) {
        this.snackbar.openFromComponent(SnackBarComponent, {
            duration: 1*60*1000, // 1 minute
            verticalPosition: this.getVerticalPosition(),
            horizontalPosition: this.getHorizontalPosition(),
            data: {
                type: SnackBarTypeEnum.SUCCESS,
                message: message,
            }
        });
    }
    public error(message: string) {
        this.snackbar.openFromComponent(SnackBarComponent, {
            duration: 1*60*1000, // 1 minute
            verticalPosition: this.getVerticalPosition(),
            horizontalPosition: this.getHorizontalPosition(),
            data: {
                type: SnackBarTypeEnum.ERROR,
                message: message,
            }
        });
    }
    public info(message: string) {
        this.snackbar.openFromComponent(SnackBarComponent, {
            duration: 1*60*1000, // 1 minute
            verticalPosition: this.getVerticalPosition(),
            horizontalPosition: this.getHorizontalPosition(),
            data: {
                type: SnackBarTypeEnum.INFO,
                message: message,
            }
        });
    }
}