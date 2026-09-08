import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { CrudFieldInfoType } from '@base/crud/type';
import { CrudFieldUiTypeEnum } from '@base/crud/enum';
import { CrudService } from '@base/crud/service';

@Component({
  selector: 'app-crud-default-view-record',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, TranslocoModule],
})
export class CrudDefaultViewRecordComponent {
  public readonly service = inject(CrudService);

  /** Omit skipped fields and hidden record values. */
  public readonly fields = computed<[string, CrudFieldInfoType][]>(() =>
    Object.entries(this.service.state.view.viewFieldObj())
      .filter(([, field]) => !field.skip && field.type !== CrudFieldUiTypeEnum.HIDDEN),
  );
}
