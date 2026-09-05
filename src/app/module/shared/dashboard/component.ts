import { CommonModule } from "@angular/common";
import { Component, OnInit, inject, viewChild } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { PaginationComponent } from "@base/pagination/component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { SelectionModel } from "@angular/cdk/collections";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { A11yModule } from "@angular/cdk/a11y";
import { CdkPortal } from "@angular/cdk/portal";
import { PrivateAreaLayoutDirective } from "@area/private/directive";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { MatTabsModule } from "@angular/material/tabs";
import { AppPaginationEvent } from "@base/pagination/type";
import { PrivateAreaLayoutService } from "@area/private/service";
import { DASHBOARD_PROVIDER } from "./provider";
import { DashboardService } from "./service";

export interface TableItem {
  customerImage: string;
  customerName: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  lastVisitedDate: string;
  lastVisitedTime: string;
  totalPurchaseLifetime: number;
  totalPurchaseThisMonth: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface DashboardColumnOption {
  key: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterModule,
    CommonModule,

    CdkPortal,
    PrivateAreaLayoutDirective,

    MatIconModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatTableModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatTabsModule,

    CdkDropList,
    CdkDrag,
    A11yModule,

    PaginationComponent,
  ],
  providers: [
    DASHBOARD_PROVIDER,
  ],
})
export class DashboardComponent implements OnInit {
    //@ViewChild("searchDrawer") searchDrawer!: MatDrawer;
    public searchDrawer = viewChild<MatDrawer>('searchDrawer');

    protected readonly service = inject(DashboardService);

    protected readonly bpo = inject(BreakpointObserverService);
    protected readonly privateAreaLayoutService = inject(PrivateAreaLayoutService);
    
    protected readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;

  protected readonly availableColumns: DashboardColumnOption[] = [
    { key: 'customerName', label: 'Customer Info', description: 'Name, city and country' },
    { key: 'contactInfo', label: 'Contact', description: 'Email and phone' },
    { key: 'lastVisited', label: 'Last Visited', description: 'Date and time' },
    { key: 'totalPurchase', label: 'Total Purchase', description: 'Lifetime and monthly totals' },
    { key: 'status', label: 'Status', description: 'Order counters' },
    { key: 'actions', label: 'Actions', description: 'Row actions' },
  ];

  protected originalTabledata: TableItem[] = [
    {
      customerImage: 'assets/img/user-1.jpg',
      customerName: 'Michael Johnson',
      city: 'Los Angeles',
      country: 'USA',
      email: 'michael.j@email.com',
      phone: '555-234-5678',
      lastVisitedDate: '2025-09-22',
      lastVisitedTime: '09:00 AM',
      totalPurchaseLifetime: 2100.5,
      totalPurchaseThisMonth: 250.75,
      activeOrders: 3,
      completedOrders: 22,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-2.jpg',
      customerName: 'Emily Williams',
      city: 'Paris',
      country: 'France',
      email: 'emily.w@email.com',
      phone: '555-876-5432',
      lastVisitedDate: '2025-09-21',
      lastVisitedTime: '04:15 PM',
      totalPurchaseLifetime: 850.0,
      totalPurchaseThisMonth: 120.0,
      activeOrders: 0,
      completedOrders: 10,
      cancelledOrders: 2,
    },
    {
      customerImage: 'assets/img/user-3.jpg',
      customerName: 'David Brown',
      city: 'Tokyo',
      country: 'Japan',
      email: 'david.b@email.com',
      phone: '555-345-6789',
      lastVisitedDate: '2025-09-20',
      lastVisitedTime: '11:50 AM',
      totalPurchaseLifetime: 350.25,
      totalPurchaseThisMonth: 45.5,
      activeOrders: 1,
      completedOrders: 5,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-4.jpg',
      customerName: 'Olivia Davis',
      city: 'Sydney',
      country: 'Australia',
      email: 'olivia.d@email.com',
      phone: '555-765-4321',
      lastVisitedDate: '2025-09-19',
      lastVisitedTime: '06:30 PM',
      totalPurchaseLifetime: 1500.0,
      totalPurchaseThisMonth: 300.0,
      activeOrders: 2,
      completedOrders: 18,
      cancelledOrders: 1,
    },
    {
      customerImage: 'assets/img/user-5.jpg',
      customerName: 'Daniel Wilson',
      city: 'Berlin',
      country: 'Germany',
      email: 'daniel.w@email.com',
      phone: '555-456-7890',
      lastVisitedDate: '2025-09-18',
      lastVisitedTime: '01:20 PM',
      totalPurchaseLifetime: 675.8,
      totalPurchaseThisMonth: 80.25,
      activeOrders: 0,
      completedOrders: 9,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-6.jpg',
      customerName: 'Sophia Martinez',
      city: 'Madrid',
      country: 'Spain',
      email: 'sophia.m@email.com',
      phone: '555-654-3210',
      lastVisitedDate: '2025-09-17',
      lastVisitedTime: '09:45 AM',
      totalPurchaseLifetime: 950.9,
      totalPurchaseThisMonth: 150.0,
      activeOrders: 1,
      completedOrders: 14,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-7.jpg',
      customerName: 'Matthew Taylor',
      city: 'Toronto',
      country: 'Canada',
      email: 'matthew.t@email.com',
      phone: '555-543-2109',
      lastVisitedDate: '2025-09-16',
      lastVisitedTime: '03:10 PM',
      totalPurchaseLifetime: 420.0,
      totalPurchaseThisMonth: 65.75,
      activeOrders: 0,
      completedOrders: 7,
      cancelledOrders: 1,
    },
    {
      customerImage: 'assets/img/user-8.jpg',
      customerName: 'Isabella Anderson',
      city: 'Rome',
      country: 'Italy',
      email: 'isabella.a@email.com',
      phone: '555-432-1098',
      lastVisitedDate: '2025-09-15',
      lastVisitedTime: '08:00 PM',
      totalPurchaseLifetime: 2800.5,
      totalPurchaseThisMonth: 450.0,
      activeOrders: 4,
      completedOrders: 30,
      cancelledOrders: 2,
    },
    {
      customerImage: 'assets/img/user-9.jpg',
      customerName: 'Joseph Thomas',
      city: 'Dubai',
      country: 'UAE',
      email: 'joseph.t@email.com',
      phone: '555-321-0987',
      lastVisitedDate: '2025-09-14',
      lastVisitedTime: '05:00 AM',
      totalPurchaseLifetime: 760.0,
      totalPurchaseThisMonth: 95.0,
      activeOrders: 1,
      completedOrders: 11,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-10.jpg',
      customerName: 'Ava Hernandez',
      city: 'Mexico City',
      country: 'Mexico',
      email: 'ava.h@email.com',
      phone: '555-210-9876',
      lastVisitedDate: '2025-09-13',
      lastVisitedTime: '12:00 PM',
      totalPurchaseLifetime: 550.0,
      totalPurchaseThisMonth: 70.0,
      activeOrders: 0,
      completedOrders: 6,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-1.jpg',
      customerName: 'Christopher Moore',
      city: 'Shanghai',
      country: 'China',
      email: 'chris.m@email.com',
      phone: '555-109-8765',
      lastVisitedDate: '2025-09-12',
      lastVisitedTime: '07:45 PM',
      totalPurchaseLifetime: 1800.0,
      totalPurchaseThisMonth: 200.0,
      activeOrders: 2,
      completedOrders: 25,
      cancelledOrders: 1,
    },
    {
      customerImage: 'assets/img/user-2.jpg',
      customerName: 'Mia White',
      city: 'Mumbai',
      country: 'India',
      email: 'mia.w@email.com',
      phone: '555-987-6543',
      lastVisitedDate: '2025-09-11',
      lastVisitedTime: '02:30 PM',
      totalPurchaseLifetime: 600.5,
      totalPurchaseThisMonth: 85.0,
      activeOrders: 1,
      completedOrders: 12,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-3.jpg',
      customerName: 'James Harris',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      email: 'james.h@email.com',
      phone: '555-876-5432',
      lastVisitedDate: '2025-09-10',
      lastVisitedTime: '10:15 AM',
      totalPurchaseLifetime: 950.0,
      totalPurchaseThisMonth: 110.0,
      activeOrders: 0,
      completedOrders: 16,
      cancelledOrders: 0,
    },
    {
      customerImage: 'assets/img/user-4.jpg',
      customerName: 'Charlotte Clark',
      city: 'Moscow',
      country: 'Russia',
      email: 'charlotte.c@email.com',
      phone: '555-765-4321',
      lastVisitedDate: '2025-09-09',
      lastVisitedTime: '04:50 PM',
      totalPurchaseLifetime: 1200.75,
      totalPurchaseThisMonth: 180.5,
      activeOrders: 3,
      completedOrders: 20,
      cancelledOrders: 1,
    },
    {
      customerImage: 'assets/img/user-5.jpg',
      customerName: 'Ethan Lewis',
      city: 'Cairo',
      country: 'Egypt',
      email: 'ethan.l@email.com',
      phone: '555-654-3210',
      lastVisitedDate: '2025-09-08',
      lastVisitedTime: '09:20 AM',
      totalPurchaseLifetime: 320.0,
      totalPurchaseThisMonth: 55.0,
      activeOrders: 0,
      completedOrders: 4,
      cancelledOrders: 0,
    },
  ];

  protected dataSource = new MatTableDataSource<TableItem>([]);
  protected readonly selectionColumn = 'select';
  protected displayedColumns: string[] = [
    this.selectionColumn,
    'customerName',
    'contactInfo',
    'lastVisited',
    'totalPurchase',
    'status',
    'actions',
  ];
  protected readonly selectedRows = new SelectionModel<TableItem>(true, []);
  protected readonly allColumnsValue = '__all_columns__';
  protected searchQuery = '';

  protected pagination = {
    pageIndex: 1,
    pageSize: 10,
    totalItems: this.originalTabledata.length,
    pageSizeOptions: [5, 10, 20, 50],
  };

  constructor() {
    this.updateTableDataForCurrentPage();
  }

    public async ngOnInit(): Promise<void> {}

   

  protected drop(event: CdkDragDrop<string[]>) {
    const draggableColumns = this.displayedColumns.filter(
      (column) => column !== this.selectionColumn,
    );
    moveItemInArray(draggableColumns, event.previousIndex, event.currentIndex);
    this.displayedColumns = [this.selectionColumn, ...draggableColumns];
  }
  // [x]
  protected onDisplayedColumnsChange(selectedColumns: string[]): void {
    const hasAllSelected = selectedColumns.includes(this.allColumnsValue);
    const wasAllSelected = this.isAllColumnsSelected();
    const selectedColumnKeys = selectedColumns.filter((column) => column !== this.allColumnsValue);

    if (hasAllSelected && !wasAllSelected) {
      this.displayedColumns = [
        this.selectionColumn,
        ...this.availableColumns.map((column) => column.key),
      ];
      return;
    }

    if (
      wasAllSelected &&
      !hasAllSelected &&
      selectedColumnKeys.length === this.availableColumns.length
    ) {
      this.displayedColumns = [this.selectionColumn];
      return;
    }

    const selectedSet = new Set(selectedColumnKeys);
    this.displayedColumns = [
      this.selectionColumn,
      ...this.availableColumns
        .map((column) => column.key)
        .filter((column) => selectedSet.has(column)),
    ];
  }

  protected isAllColumnsSelected(): boolean {
    return this.displayedColumns.length === this.availableColumns.length + 1;
  }

  // [x]
  protected getDisplayedColumnSelectionValue(): string[] {
    if (this.isAllColumnsSelected()) {
      return [this.allColumnsValue, ...this.displayedColumns];
    }

    return this.displayedColumns;
  }

  protected getSelectedColumnLabels(): string {
    const selectedSet = new Set(this.displayedColumns);
    return this.availableColumns
      .filter((column) => selectedSet.has(column.key))
      .map((column) => column.label)
      .join(', ');
  }

  protected isAllRowsSelected(): boolean {
    const numRows = this.dataSource.data.length;
    const selectedRowsCount = this.dataSource.data.filter((row) =>
      this.selectedRows.isSelected(row),
    ).length;
    return numRows > 0 && selectedRowsCount === numRows;
  }

  protected isPartiallySelected(): boolean {
    const numRows = this.dataSource.data.length;
    const selectedRowsCount = this.dataSource.data.filter((row) =>
      this.selectedRows.isSelected(row),
    ).length;
    return selectedRowsCount > 0 && selectedRowsCount < numRows;
  }

  protected toggleAllRows(): void {
    if (this.isAllRowsSelected()) {
      this.selectedRows.clear();
      return;
    }

    this.selectedRows.select(...this.dataSource.data);
  }

  protected toggleRowSelection(row: TableItem): void {
    this.selectedRows.toggle(row);
  }

  public onPageChange(event: AppPaginationEvent): void {
    this.pagination.pageIndex = event.pageIndex;
    this.pagination.pageSize = event.pageSize;
    this.updateTableDataForCurrentPage();
  }

  public setSearchQuery(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.pagination.pageIndex = 1;
    this.updateTableDataForCurrentPage();
  }

  public clearSearchQuery(searchInput: HTMLInputElement): void {
    searchInput.value = '';
    this.searchQuery = '';
    this.pagination.pageIndex = 1;
    this.updateTableDataForCurrentPage();
  }

    // [x]
    public onSearchButtonClick(event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.searchDrawer()!.open();
    }

    public closeSearchDrawer(): void {
        this.searchDrawer()!.close();
    }

  private updateTableDataForCurrentPage(): void {
    const filteredData = this.originalTabledata.filter((item) => {
      const searchTarget =
        `${item.customerName} ${item.city} ${item.country} ${item.email} ${item.phone}`.toLowerCase();
      return searchTarget.includes(this.searchQuery);
    });

    this.pagination.totalItems = filteredData.length;
    const startIndex = (this.pagination.pageIndex - 1) * this.pagination.pageSize;
    const endIndex = startIndex + this.pagination.pageSize;
    this.dataSource.data = filteredData.slice(startIndex, endIndex);
  }
}
