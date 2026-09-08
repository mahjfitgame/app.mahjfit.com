// file: src/app/area/auth/nav/component.ts
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthNavService } from '@area/auth/nav/service';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';

/**
 * @AuthNavComponent
 * the auth area's menus, one component per nav_position
 *
 *   BOTTOM — the footer bar in the end side footer (plain text links)
 *   START / END / TOP — declared, empty today. every auth row is hidden
 *
 * ⚠ the mirror of PrivateNavComponent, deliberately. only BOTTOM is applicable
 * in this area — the auth layout is two panes and a portal, it has no sidebar
 *
 * ⚠ imports are only what the BOTTOM branch renders. MatList / MatExpansion /
 * NgTemplateOutlet come in WITH a START branch, not before it
 *
 * ⚠ NO providers. AuthNavState and AuthNavService are provided by
 * AuthAreaLayoutComponent so every position reads one instance and one build
 */
@Component({
    selector: 'app-auth-nav',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        RouterLink,
        TranslocoModule,
    ],
})
export class AuthNavComponent {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly service = inject(AuthNavService);

    /**
     * ⚠ an input, to load specific position of nav
     */
    public readonly position = input.required<FoundationNavPositionEnum>();
    /**
     * ⚠ declared for parity with PrivateNavComponent, unbound today. the auth
     * layout has no drawer, so no caller has anything to close on navigation
     */
    public readonly navigated = output<void>();
}
