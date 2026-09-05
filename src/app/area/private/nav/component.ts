// file: src/app/area/private/nav/component.ts
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { PrivateNavService } from '@area/private/nav/service';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';

/**
 * @PrivateNavComponent
 * the private area's menus, one component per nav_position
 *
 *   START  — the sidebar list (mat-nav-list + mat-accordion, recursive)
 *   BOTTOM — the footer bar in the main content footer (plain text links)
 *   END / TOP — declared, empty today
 *
 * ⚠ each position renders a DIFFERENT markup shape. they are not variants of
 * one list, do not try to unify them
 *
 * ⚠ NO providers. PrivateNavState and PrivateNavService are provided by
 * PrivateAreaLayoutComponent so the sidebar, the avatar menu and the footer bar
 * share one instance and one build
 */
@Component({
    selector: 'app-private-nav',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgClass,
        NgTemplateOutlet,
        RouterLink,
        RouterLinkActive,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        TranslocoModule,
    ],
})
export class PrivateNavComponent {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly service = inject(PrivateNavService);

    /**
     * ⚠ an input, to load specific position of nav 
     */
    public readonly position = input.required<FoundationNavPositionEnum>();
    /**
     * ⚠ an output, not a service call. closeSidenavIfSmAndDown(sidenav) lives
     * on PrivateAreaLayoutComponent:188 and takes the #BfwStartSideBar template
     * ref, which a child component cannot reach
     */
    public readonly navigated = output<void>();
}
