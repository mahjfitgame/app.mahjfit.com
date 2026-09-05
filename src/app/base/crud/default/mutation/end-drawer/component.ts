// file: src/app/base/crud/default/mutation/end-drawer/component.ts
import { Component, inject } from '@angular/core';
import { NgClass, NgComponentOutlet } from '@angular/common';
import { CrudService } from '@base/crud/service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-mutation-end-drawer',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    TranslocoModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    NgComponentOutlet,
  ],
  providers: [],
})
export class CrudDefaultMutationEndDrawerComponent {
  public readonly service = inject(CrudService);
}
