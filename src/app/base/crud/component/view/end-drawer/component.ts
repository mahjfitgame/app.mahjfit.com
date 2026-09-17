import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoModule } from '@jsverse/transloco';
import { CrudService } from 'src/app/base/crud/service/entry';

@Component({
  selector: 'crud-view-end-drawer-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [NgComponentOutlet, TranslocoModule, MatIconModule, MatButtonModule, MatSidenavModule, MatToolbarModule],
})
export class CrudViewEndDrawerComponent {
  public readonly service = inject(CrudService);
}
