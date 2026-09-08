// file: src/app/base/crud/default/view/dialog/component.ts
import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-view-dialog',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [TranslocoModule, MatIconModule, MatButtonModule, MatToolbarModule, NgComponentOutlet],
  providers: [],
})
export class CrudDefaultViewDialogComponent {
  public readonly service = inject(CrudService);
  private readonly dialogRef = inject(MatDialogRef<CrudDefaultViewDialogComponent>);
}