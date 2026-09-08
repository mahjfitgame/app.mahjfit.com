import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';
import { ConfirmationDialogDataType } from '@base/confirmation-dialog/type';

@Component({
    selector: 'app-confirmation-dialog',
    standalone: true,
    templateUrl: './template.html',
    imports: [
        TranslocoModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatToolbarModule,
    ],
})
export class ConfirmationDialogComponent {
    public readonly data = inject<ConfirmationDialogDataType>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(
        MatDialogRef<ConfirmationDialogComponent, boolean>,
    );

    public close(confirmed: boolean): void {
        this.dialogRef.close(confirmed);
    }
}
