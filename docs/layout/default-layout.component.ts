import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PortalModule } from '@angular/cdk/portal';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LayoutSlotsStore } from './layout-slots.store';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    PortalModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './default-layout.component.html',
})
export class DefaultLayoutComponent {
  readonly layoutSlots = inject(LayoutSlotsStore);
}