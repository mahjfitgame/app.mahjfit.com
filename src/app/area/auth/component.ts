// file: src/app/area/auth/component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { PortalModule } from '@angular/cdk/portal';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthAreaLayoutService } from '@area/auth/service';
import { AuthAreaLayoutState } from '@area/auth/state';

@Component({
  selector: 'app-auth-area-layout',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterOutlet,
    RouterModule,
    PortalModule,
    
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [
    AuthAreaLayoutState,
    AuthAreaLayoutService,
  ],
})
export class AuthAreaLayoutComponent implements OnInit, OnDestroy {
  protected readonly route = inject(ActivatedRoute);
  protected readonly service = inject(AuthAreaLayoutService);
  

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
