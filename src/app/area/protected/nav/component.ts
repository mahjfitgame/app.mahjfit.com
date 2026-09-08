// file: src/app/area/protected/nav/component.ts
import { NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { ProtectedNavService } from '@area/protected/nav/service';

/**
 * @ProtectedNavComponent
 * this area's menus, one branch per nav_position
 *
 *   TOP    — the main menu in the header bar (icon + label pills)
 *   BOTTOM — the footer bar (plain text links)
 *   START / END — declared, empty today. this shell has no drawer
 *
 * ⚠ each position renders a DIFFERENT markup shape. they are not variants of
 * one list, do not try to unify them
 *
 * ⚠ NO providers. ProtectedNavState and ProtectedNavService are provided by
 * ProtectedAreaLayoutComponent so the header, the avatar menu and the footer
 * all read one instance and one build
 *
 * ⚠ imports are only what the TOP and BOTTOM branches render. MatList /
 * MatExpansion / NgTemplateOutlet come in WITH a recursive START branch, not
 * before it
 */
@Component({
    selector: 'app-protected-nav',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        NgClass,
        RouterLink,
        RouterLinkActive,
        MatIconModule,
        TranslocoModule,
    ],
})
export class ProtectedNavComponent {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly service = inject(ProtectedNavService);

    /** ⚠ an input, to load a specific position of nav */
    public readonly position = input.required<FoundationNavPositionEnum>();

    /**
     * ⚠ declared for parity with PrivateNavComponent. bound by the mobile menu
     * in protected/template.html, which closes itself on navigation
     */
    public readonly navigated = output<void>();
}
