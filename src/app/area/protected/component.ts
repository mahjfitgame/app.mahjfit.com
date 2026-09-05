// file: src/app/area/protected/component.ts
import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { PortalModule } from "@angular/cdk/portal";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule, RouterOutlet } from "@angular/router";
import { TranslocoModule } from '@jsverse/transloco';
import { BreadcrumbComponent, BreadcrumbItemDirective } from 'xng-breadcrumb';
import { NotifyBannerComponent } from "@base/notify-banner/component";
import { ProtectedAreaLayoutService } from "@area/protected/service";
import { ProtectedAreaLayoutState } from "@area/protected/state";
import { ProtectedNavComponent } from "@area/protected/nav/component";
import { ProtectedNavService } from "@area/protected/nav/service";
import { PROTECTED_NAV_PROVIDER } from "@area/protected/nav/provider";

/**
 * @ProtectedAreaLayoutComponent
 * the shell every /account page renders inside
 *
 * ⚠ DELIBERATELY a top bar and a page, not a copy of the private area. that one
 * is a back office console — two drawers, a tab group, six portal slots. this
 * one is a website's signed in header, so it carries two slots and no drawer.
 * grow it when a module needs the outlet, never ahead of one
 *
 * ⚠ providers live HERE, not on ProtectedNavComponent, so the header menu, the
 * avatar menu and the footer bar all read ONE instance and ONE build
 */
@Component({
    selector: 'app-protected-area-layout',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        RouterOutlet,
        RouterModule,
        PortalModule,

        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        MatTooltipModule,

        BreadcrumbComponent,
        BreadcrumbItemDirective,

        NotifyBannerComponent,
        TranslocoModule,

        ProtectedNavComponent,
    ],
    providers: [
        ProtectedAreaLayoutState,
        ProtectedAreaLayoutService,

        PROTECTED_NAV_PROVIDER,
    ],
})
export class ProtectedAreaLayoutComponent implements OnInit, OnDestroy {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly service = inject(ProtectedAreaLayoutService);

    /**
     * this area's menus, all generated from ProtectedAreaRegistry.build()
     *
     * ⚠ read directly by the avatar menu in this template. the header and
     * footer bars go through <app-protected-nav />, which injects the service
     * itself
     */
    public readonly nav = inject(ProtectedNavService);

    // STATE ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** the mobile menu. a plain field, nothing outside this shell reads it */
    protected mobileMenuOpen = false;

    public async ngOnInit(): Promise<void> {
        this.service.log.debug('[ProtectedAreaLayoutComponent] initialized');
    }

    public async ngOnDestroy(): Promise<void> {
        this.service.state.setDefault();
        this.service.log.debug('[ProtectedAreaLayoutComponent] destroyed and layouts cleared');
    }

    // BEHAVIOUR ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    /**
     * ⚠ the counterpart of PrivateAreaLayoutComponent.closeSidenavIfSmAndDown().
     * the header menu is always mounted; only the small screen drawer needs
     * closing, so a click on a link that is visible anyway must not toggle it
     */
    public closeMobileMenuIfSmAndDown(): void {
        if (this.service.bos.isSmAndDown()) {
            this.mobileMenuOpen = false;
        }
    }
}
