import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialogComponent } from '@base/confirmation-dialog/component';
import { ConfirmationDialogDataType } from '@base/confirmation-dialog/type';

@Service()
export class ConfirmationDialogService {
    private readonly dialog = inject(MatDialog);

    public async confirm(
        data: ConfirmationDialogDataType,
        config: Omit<
            MatDialogConfig<ConfirmationDialogDataType>,
            'data'
        > = {},
    ): Promise<boolean> {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            ...config,
            data,
        });

        return await firstValueFrom(dialogRef.afterClosed()) === true;
    }
}
