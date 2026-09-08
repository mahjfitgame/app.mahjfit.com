import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudDefaultViewEndDrawerComponent } from './end-drawer/component';
import { CrudDefaultViewEndSideBarComponent } from './end-side-bar/component';

@Component({
  selector: 'app-crud-default-view',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgComponentOutlet,
    CrudDefaultViewEndDrawerComponent,
    CrudDefaultViewEndSideBarComponent,
  ],
})
export class CrudDefaultViewComponent {
  public readonly service = inject(CrudService);
}
