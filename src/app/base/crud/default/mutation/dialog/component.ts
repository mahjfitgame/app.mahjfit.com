// file: src/app/base/crud/default/mutation/dialog/component.ts
import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from '@base/crud/service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-mutation-dialog',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [TranslocoModule, MatIconModule, MatButtonModule, MatToolbarModule, NgComponentOutlet],
  providers: [],
})
export class CrudDefaultMutationDialogComponent {
  public readonly service = inject(CrudService);
  private readonly dialogRef = inject(MatDialogRef<CrudDefaultMutationDialogComponent>);

  public closeDialog(): void {
    this.dialogRef.close();
  }
}
