import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, effect, ElementRef, inject, Input, OnDestroy, OnInit, viewChild, ViewChild } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { MatIcon } from "@angular/material/icon";
import { MatListModule, MatNavList } from "@angular/material/list";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ActivatedRoute, RouterModule, RouterOutlet } from "@angular/router";
import { BreadcrumbComponent, BreadcrumbItemDirective } from 'xng-breadcrumb';
import { PrivateAreaLayoutService } from "@area/private/service";
import { PortalModule } from "@angular/cdk/portal";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotifyBannerComponent } from "@base/notify-banner/component";
import { TranslocoModule } from '@jsverse/transloco';
import { PrivateAreaLayoutState } from "@area/private/state";

interface NavItem {
  name: string;
  route?: string;
  icon: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-private-area-layout',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterOutlet,
    RouterModule,
    PortalModule,

    CommonModule,
    MatIcon,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatBadgeModule,
    MatNavList,
    MatListModule,
    MatAccordion,
    MatExpansionModule,
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,

    BreadcrumbComponent,
    BreadcrumbItemDirective,

        NotifyBannerComponent,
        TranslocoModule,
    ],
    providers: [
        PrivateAreaLayoutState,
        PrivateAreaLayoutService,
    ],
})
export class PrivateAreaLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  public readonly route = inject(ActivatedRoute);
  public readonly service = inject(PrivateAreaLayoutService);

    //@ViewChild('BfwEndSideBarTabGroup') endSideBarTabGroup!: MatTabGroup;
    //@ViewChild('BfwEndSideBarTabGroup', { read: ElementRef }) endSideBarTabGroupElement!: ElementRef;
    public endSideBarTabGroupElement = viewChild<ElementRef>('BfwEndSideBarTabGroup');
    

  navItems: NavItem[] = [
    { name: 'Home', route: '/', icon: 'house' },
    { name: 'Dashboard', route: '/account/dashboard', icon: 'list' },
    { name: 'My Profile', route: '/account/my-profile', icon: 'person' },
    {
      name: 'Geo',
      icon: 'planet',
      children: [{ name: 'Country', route: '/account/geo/country', icon: 'globe' }],
    },
    {
      name: 'Projects',
      icon: 'dashboard',
      children: [
        { name: 'Projects', route: '/app/projects', icon: 'assignment' },
        { name: 'Dashboard', route: '/dashboard', icon: 'subject' },
        { name: 'All Task', route: '/app/all-tasks', icon: 'checklist' },
        { name: 'Tasks Details', route: '/app/task-details', icon: 'task' },
        { name: 'Task Kanban', route: '/app/kanban', icon: 'view_kanban' },
        { name: 'Task Gantt Chart', route: '/app/gantt-chart', icon: 'event' },
        { name: 'Time Tacking', route: '/app/time-tracking', icon: 'alarm' },
      ],
    },
    {
      name: 'E-commerce',
      icon: 'shopping_cart',
      children: [
        { name: 'Customers', route: '/account/my-profile', icon: 'group' },
        { name: 'Orders', route: '/app/orders', icon: 'local_mall' },
        { name: 'Shop', route: '/app/ecommerce', icon: 'storefront' },
        { name: 'Products', route: '/app/products', icon: 'store' },
        { name: 'Product', route: '/app/product', icon: 'sell' },
        { name: 'Cart', route: '/app/cart', icon: 'shopping_cart' },
        { name: 'Checkout', route: '/app/checkout', icon: 'local_mall' },
        { name: 'Add Product', route: '/app/add-product', icon: 'add_box' },
        { name: 'Invoice', route: '/app/invoice', icon: 'receipt' },
        { name: 'Shipping', route: '/app/shipping', icon: 'local_shipping' },
        { name: 'Return', route: '/app/return', icon: 'assignment_returned' },
        { name: 'Payment', route: '/app/payment', icon: 'payment' },
      ],
    },
    {
      name: 'Account',
      icon: 'account_circle',
      children: [
        {
          name: 'Profile',
          icon: 'person',
          children: [
            { name: 'Personal', route: '/app/profile', icon: 'perm_identity' },
            { name: 'Level 3 Menu ', route: '/app/dashboard', icon: 'subdirectory_arrow_right' },
          ],
        },
        { name: 'Subscription', route: '/app/subscription', icon: 'workspace_premium' },
        { name: 'Plans', route: '/app/plans', icon: 'star' },
        { name: 'Settings', route: '/app/settings', icon: 'settings' },
      ],
    },
    {
      name: 'Applications',
      icon: 'apps',
      children: [
        { name: 'Explorer', route: '/app/explorer', icon: 'folder_zip' },
        { name: 'Calendar', route: '/app/calendar', icon: 'event' },
        { name: 'Chat', route: '/app/chat', icon: 'chat' },
      ],
    },
    {
      name: 'Front Website',
      icon: 'language',
      children: [
        { name: 'Home', route: '../web/website', icon: 'web' },
        { name: 'About Us', route: '../web/about-us', icon: 'apartment' },
        { name: 'Case Study', route: '../web/case-study', icon: 'border_all' },
        { name: 'Blog', route: '../web/blog', icon: 'newspaper' },
        { name: 'Blog Details', route: '../web/blog-details', icon: 'newspaper' },
        { name: 'Contact Us', route: '../web/contact-us', icon: 'mail' },
      ],
    },
    {
      name: 'Supportive',
      icon: 'extension',
      children: [
        { name: 'Coming Soon', route: '../coming-soon', icon: 'event' },
        { name: 'Page Not Found', route: '../**', icon: 'bug_report' },
      ],
    },
    { name: 'Pages', route: '/app/pages', icon: 'layers' },
  ];

  constructor() {}

    public async ngOnInit(): Promise<void> {
        this.service.log.debug('[PrivateAreaLayoutComponent] initialized');
    }

    public async ngOnDestroy(): Promise<void> {
        this.service.state.setDefault();
        this.service.log.debug('[PrivateAreaLayoutComponent] destroyed and layouts cleared');
    }

    public async ngAfterViewInit(): Promise<void> {
    }

    public closeSidenavIfSmAndDown(sidenav: MatSidenav): void {
        if(this.service.bos.isSmAndDown()) {
            sidenav.toggle();
        }
    }

    public scrollToActiveBfwEndSideBarTab() {
        // We need a tiny delay to ensure the DOM has updated the 'active' class
        setTimeout(() => {
            const activeLabel = this.endSideBarTabGroupElement()?.nativeElement.querySelector('.mdc-tab--active');
            if (activeLabel) {
                activeLabel.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center', // This centers the tab in the header view
                    block: 'nearest'
                });
            }
        }, 30);
    }
}