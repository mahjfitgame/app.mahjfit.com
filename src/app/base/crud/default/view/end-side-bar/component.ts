import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CdkPortal } from '@angular/cdk/portal';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudService } from 'src/app/base/crud/service/entry';

@Component({
  selector: 'app-crud-default-view-end-side-bar',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CdkPortal, NgComponentOutlet, MatButtonModule, MatIconModule, TranslocoModule, PrivateAreaLayoutDirective],
})
export class CrudDefaultViewEndSideBarComponent {
  public readonly service = inject(CrudService);
}
