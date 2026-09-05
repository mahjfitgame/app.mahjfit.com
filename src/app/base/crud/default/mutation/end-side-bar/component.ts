// file: src/app/base/crud/default/mutation/end-side-bar/component.ts
import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from '@base/crud/service';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-mutation-end-side-bar',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    CdkPortal,
    PrivateAreaLayoutDirective,

    TranslocoModule,

    MatIconModule,
    MatButtonModule,

    NgComponentOutlet,
  ],
  providers: [],
})
export class CrudDefaultMutationEndSideBarComponent {
  public readonly service = inject(CrudService);
}
