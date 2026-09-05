import {

  Component,
  inject,
  input,
  OnChanges,
  output,
  SimpleChanges,
  viewChild,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AppPaginationEvent } from '@base/pagination/type';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    FormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [MatPaginatorIntl],
})
export class PaginationComponent implements OnChanges {
  public paginator = viewChild(MatPaginator);

  public totalRecords = input(0);

  // Parent sends 1-based page index: 1,2,3...
  public readonly pageIndex = input(1);

  public readonly pageSize = input(10);
  public readonly pageSizeOptions = input<number[]>([5, 10, 25, 50, 100]);
  public readonly showFirstLastButtons = input(true);
  public readonly hidePageSize = input(false);
  public readonly disabled = input(false);
  public readonly showJumpToPage = input(true);

  /**
   * LABELS
   *
   * Plain display text, NOT i18n keys — this component has no bundle of its
   * own and never pipes through transloco. The usage site translates and
   * passes the result in (see src/app/base/crud/default/pagination/), so the
   * same component serves a translated page and a plain one.
   *
   * Defaults are the English text this template used to hardcode, so a caller
   * that passes nothing renders exactly as before.
   */
  public readonly pageLabel = input('Page');

  /**
   * '{total}' is substituted with the page count — SINGLE braces on purpose.
   * Transloco owns '{{ }}', so a double-braced token would be eaten as a
   * missing param before it ever reached this component. Keeping the count
   * inside the string lets a language put it first ('{total} में से').
   */
  public readonly totalPagesLabel = input('of {total}');

  public readonly goLabel = input('Go');

  /**
   * MAT PAGINATOR LABELS
   *
   * mat-paginator takes no inputs for these - it reads MatPaginatorIntl, which
   * is why they are mirrored into our own intl instance in syncIntlLabels().
   * itemsPerPageLabel is visible text; the other four are the aria-label and
   * tooltip on the first/prev/next/last buttons.
   *
   * Defaults are Material's own strings, colon included, so an unbound caller
   * renders exactly as before.
   */
  public readonly itemsPerPageLabel = input('Items per page:');
  public readonly nextPageLabel = input('Next page');
  public readonly previousPageLabel = input('Previous page');
  public readonly firstPageLabel = input('First page');
  public readonly lastPageLabel = input('Last page');

  public readonly pageChange = output<AppPaginationEvent>();

  private readonly intl = inject(MatPaginatorIntl);

  // Internal Material paginator state is 0-based
  currentMatPageIndex = 0;
  currentPageSize = 10;

  // Textbox stays human-friendly
  jumpPageNumber: number | null = 1;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageIndex']) {
      this.currentMatPageIndex = this.toMatPageIndex(this.pageIndex());
    }

    if (changes['pageSize']) {
      this.currentPageSize = this.toSafePageSize(this.pageSize());
    }

    if (
      changes['itemsPerPageLabel'] ||
      changes['nextPageLabel'] ||
      changes['previousPageLabel'] ||
      changes['firstPageLabel'] ||
      changes['lastPageLabel']
    ) {
      this.syncIntlLabels();
    }

    this.syncJumpPage();
  }
  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords() / this.currentPageSize));
  }
  public get totalPagesText(): string {
    return this.totalPagesLabel().replace('{total}', String(this.totalPages));
  }
  public onPaginatorChange(event: PageEvent): void {
    this.currentMatPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.syncJumpPage();

    this.pageChange.emit({
      previousPageIndex: this.toAppPageIndex(event.previousPageIndex ?? 0),
      pageIndex: this.toAppPageIndex(this.currentMatPageIndex),
      pageSize: this.currentPageSize,
      totalRecords: this.totalRecords(),
    });
  }
  public goToPage(): void {
    if (this.disabled()) return;

    const rawPage = Number(this.jumpPageNumber);

    if (!Number.isFinite(rawPage)) {
      this.syncJumpPage();
      return;
    }

    const targetAppPage = Math.max(1, Math.min(rawPage, this.totalPages));
    const newMatPageIndex = this.toMatPageIndex(targetAppPage);

    if (newMatPageIndex === this.currentMatPageIndex) {
      this.jumpPageNumber = targetAppPage;
      return;
    }

    const previousMatPageIndex = this.currentMatPageIndex;

    this.currentMatPageIndex = newMatPageIndex;
    this.syncJumpPage();

    if (this.paginator()) {
      this.paginator()!.pageIndex = newMatPageIndex;
    }

    this.pageChange.emit({
      previousPageIndex: this.toAppPageIndex(previousMatPageIndex),
      pageIndex: targetAppPage,
      pageSize: this.currentPageSize,
      totalRecords: this.totalRecords(),
    });
  }
  public resetTo(pageIndex: number, pageSize: number): void {
    this.currentMatPageIndex = this.toMatPageIndex(pageIndex);
    this.currentPageSize = this.toSafePageSize(pageSize);
    this.syncJumpPage();

    if (this.paginator()) {
      this.paginator()!.pageIndex = this.currentMatPageIndex;
      this.paginator()!.pageSize = this.currentPageSize;
    }
  }
  /**
   * changes.next() is what makes a LANGUAGE SWITCH visible: the labels are
   * plain fields, so mat-paginator only re-reads them when the intl emits.
   */
  private syncIntlLabels(): void {
    this.intl.itemsPerPageLabel = this.itemsPerPageLabel();
    this.intl.nextPageLabel = this.nextPageLabel();
    this.intl.previousPageLabel = this.previousPageLabel();
    this.intl.firstPageLabel = this.firstPageLabel();
    this.intl.lastPageLabel = this.lastPageLabel();

    this.intl.changes.next();
  }
  private syncJumpPage(): void {
    this.jumpPageNumber = this.toAppPageIndex(this.currentMatPageIndex);
  }
  private toMatPageIndex(appPageIndex: unknown): number {
    const parsed = Number(appPageIndex);
    if (!Number.isFinite(parsed) || parsed < 1) return 0;
    return parsed - 1;
  }
  private toAppPageIndex(matPageIndex: unknown): number {
    const parsed = Number(matPageIndex);
    if (!Number.isFinite(parsed) || parsed < 0) return 1;
    return parsed + 1;
  }
  private toSafePageSize(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return parsed;
  }
}