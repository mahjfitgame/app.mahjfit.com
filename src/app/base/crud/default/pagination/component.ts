// file: src/app/base/crud/default/pagination/component.ts
import { Component, inject, viewChild, ViewChild } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { PaginationComponent } from '@base/pagination/component';
import { MatCardModule } from '@angular/material/card';
import { AppPaginationEvent } from '@base/pagination/type';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-pagination',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [MatCardModule, PaginationComponent, TranslocoModule],
  providers: [],
})
export class CrudDefaultPaginationComponent {
    //@ViewChild(PaginationComponent) private pagination?: PaginationComponent;
    private pagination = viewChild(PaginationComponent);

  public readonly service = inject(CrudService);

  public async onPageChange(event: AppPaginationEvent): Promise<void> {
    const loaded = await this.service.onPageChange(event);

    if (loaded) {
      return;
    }

        /**
         * API failed.
         * CRUD state still has old/correct page and page size.
         * Manually reset child paginator UI from CRUD state.
         */
        this.pagination()?.resetTo(
            this.service.state.listing.getCurrentPageValue(),
            this.service.state.listing.getRowsPerPageValue()
        );
    }
}
