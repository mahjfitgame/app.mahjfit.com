import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudViewEndDrawerComponent } from './end-drawer/component';
import { CrudViewEndSideBarComponent } from './end-side-bar/component';

@Component({
  selector: 'crud-view-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgComponentOutlet,
    CrudViewEndDrawerComponent,
    CrudViewEndSideBarComponent,
  ],
})
export class CrudViewComponent {
  public readonly service = inject(CrudService);
}
