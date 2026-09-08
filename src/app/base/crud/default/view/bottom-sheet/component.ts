// file: src/app/base/crud/default/view/bottom-sheet/component.ts
import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-view-bottom-sheet',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [TranslocoModule, MatIconModule, MatButtonModule, MatToolbarModule, NgComponentOutlet],
  providers: [],
})
export class CrudDefaultViewBottomSheetComponent {
  public readonly service = inject(CrudService);
  private readonly bottomSheetRef = inject(
    MatBottomSheetRef<CrudDefaultViewBottomSheetComponent>,
  );
}
