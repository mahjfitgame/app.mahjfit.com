// file: src/app/module/shared/geo/state/component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { GeoStateService } from '@module/shared/geo/state/service';
import { GEO_STATE_PROVIDER } from './provider';

@Component({
  selector: 'app-geo-state',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterModule,
    CommonModule,

    TranslocoModule,
  ],
  providers: [
    GEO_STATE_PROVIDER,
  ],
})
export class GeoStateComponent implements OnInit, OnDestroy {
  public readonly service = inject(GeoStateService);

  constructor() {}

  public ngOnInit(): void {
    this.service.initI18n();
    this.service.setModuleInfo();
    this.service.alterBreadcrumb();
  }
  public ngOnDestroy(): void {}
}
