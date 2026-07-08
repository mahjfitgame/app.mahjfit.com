import {
  
  Component,
  input,
  OnChanges,
  output,
  SimpleChanges,
  viewChild,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AppPaginationEvent } from '@base/pagination/type';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    FormsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class PaginationComponent implements OnChanges {
  //@ViewChild(MatPaginator) public paginator?: MatPaginator;
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

  public readonly pageChange = output<AppPaginationEvent>();

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

    this.syncJumpPage();
  }
  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords() / this.currentPageSize));
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