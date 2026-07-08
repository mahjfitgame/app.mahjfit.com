import { Component } from '@angular/core';
import { PortalModule } from '@angular/cdk/portal';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LayoutSlotDirective } from '../layout-slot.directive';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    PortalModule,
    MatButtonModule,
    MatIconModule,
    LayoutSlotDirective,
  ],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent {}