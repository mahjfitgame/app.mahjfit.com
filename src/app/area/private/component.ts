// file: src/app/area/private/component.ts
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, effect, ElementRef, inject, Input, OnDestroy, OnInit, viewChild, ViewChild } from "@angular/core";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterModule, RouterOutlet } from "@angular/router";
import { BreadcrumbComponent, BreadcrumbItemDirective } from 'xng-breadcrumb';
import { PrivateAreaLayoutService } from "@area/private/service";
import { PortalModule } from "@angular/cdk/portal";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotifyBannerComponent } from "@base/notify-banner/component";
import { TranslocoModule } from '@jsverse/transloco';
import { PrivateAreaLayoutState } from "@area/private/state";
import { PrivateNavComponent } from "@area/private/nav/component";
import { PrivateNavService } from "@area/private/nav/service";
import { PRIVATE_NAV_PROVIDER } from "./nav/provider";

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
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,

    BreadcrumbComponent,
    BreadcrumbItemDirective,

    NotifyBannerComponent,
    TranslocoModule,

    PrivateNavComponent,
    ],
    providers: [
        PrivateAreaLayoutState,
        PrivateAreaLayoutService,

        /**
         * ⚠ provided HERE, not on PrivateNavComponent, so the sidebar list, the
         * avatar menu and the footer bar all read ONE instance and ONE build
         */
        PRIVATE_NAV_PROVIDER
    ],
})
export class PrivateAreaLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
    public readonly service = inject(PrivateAreaLayoutService);

    /**
     * the area's menus, all generated from PrivateAreaRegistry.build()
     *
     * ⚠ replaces the hand written navItems (~110 lines, ~30 dead links) and
     * accountMenuItems. the sidebar renders through <app-private-nav />, the
     * avatar menu and footer bar read nav.state directly from this template
     */
    public readonly nav = inject(PrivateNavService);

    //@ViewChild('BfwEndSideBarTabGroup') endSideBarTabGroup!: MatTabGroup;
    //@ViewChild('BfwEndSideBarTabGroup', { read: ElementRef }) endSideBarTabGroupElement!: ElementRef;
    public endSideBarTabGroupElement = viewChild<ElementRef>('BfwEndSideBarTabGroup');
    
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

    public switchToActiveBfwEndSideBarTab() {
        // We need a tiny delay to ensure the DOM has updated the 'active' class
        setTimeout(() => {
            const activeLabel = this.endSideBarTabGroupElement()?.nativeElement?.querySelector('.mdc-tab--active');
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