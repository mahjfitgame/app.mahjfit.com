// file: ./src/app/module/shared/geo/country/component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudModule } from '@base/crud/module';
import { GeoCountryService } from '@module/shared/geo/country/service';
import { CrudLayoutDirective } from '@base/crud/directive';
import { MatIcon } from '@angular/material/icon';
import { TermHighlightDirective } from '@libs/utility/directive/term.highlight.directive';
import { URL_PROVIDER } from '@libs/url/provider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CRUD_PROVIDER } from '@base/crud/provider';
import { GeoCountryState } from '@module/shared/geo/country/state';

@Component({
  selector: 'app-geo-country',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    // routs
    RouterModule,
    CommonModule,

    // for parent private area layout slot for custom components
    CdkPortal,
    //PrivateAreaLayoutDirective,

    // framwork
    MatIcon,
    MatSnackBarModule,

        // custom components
        CrudLayoutDirective,
        TermHighlightDirective,
        CrudModule,
    ],
    providers: [
        URL_PROVIDER,
        CRUD_PROVIDER,
        GeoCountryState,
        GeoCountryService,
    ]
})
export class GeoCountryComponent implements OnInit, OnDestroy {
  public readonly service = inject(GeoCountryService);
  constructor() {}
  public ngOnInit(): void {
    this.service.initI18n();
  }
  public ngOnDestroy(): void {}
}
