// file: src/app/base/crud/default/mutation/bottom-sheet/component.ts
import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from '@base/crud/service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-mutation-bottom-sheet',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [TranslocoModule, MatIconModule, MatButtonModule, MatToolbarModule, NgComponentOutlet],
  providers: [],
})
export class CrudDefaultMutationBottomSheetComponent {
  public readonly service = inject(CrudService);
  private readonly bottomSheetRef = inject(
    MatBottomSheetRef<CrudDefaultMutationBottomSheetComponent>,
  );

  public closeBottomSheet(): void {
    this.bottomSheetRef.dismiss();
  }
}
