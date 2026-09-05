// file: src/app/area/auth/component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PortalModule } from '@angular/cdk/portal';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthAreaLayoutService } from '@area/auth/service';
import { AuthAreaLayoutState } from '@area/auth/state';
import { AuthNavComponent } from '@area/auth/nav/component';
import { AUTH_NAV_PROVIDER } from '@area/auth/nav/provider';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-auth-area-layout',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    TranslocoModule,
    RouterOutlet,
    RouterModule,
    PortalModule,
    
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,

    AuthNavComponent,
  ],
  providers: [
    AuthAreaLayoutState,
    AuthAreaLayoutService,

    /**
     * ⚠ provided HERE, not on AuthNavComponent, so every position reads ONE
     * instance and ONE build
     */
    AUTH_NAV_PROVIDER,
  ],
})
export class AuthAreaLayoutComponent implements OnInit, OnDestroy {
  protected readonly service = inject(AuthAreaLayoutService);

  /**
   * ⚠ no `nav` field any more. the footer bar renders through <app-auth-nav />,
   * which injects AuthNavService itself. nothing in this template reads the
   * menus directly, unlike the private area's avatar menu
   */

  constructor() {
    // TODO: need to finish dynamic content from database using api, at this moment everthing is static
  }
  
  public async ngOnInit(): Promise<void> {
    this.service.log.debug('[AuthAreaLayoutComponent] initialized');
  }

  public async ngOnDestroy() {
    this.service.state.clearAll();
    this.service.log.debug('[AuthAreaLayoutComponent] destroyed and layouts cleared');
  }
}
