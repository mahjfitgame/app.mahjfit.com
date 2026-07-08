// file: ./src/app/module/shared/geo/country/mutation/page/component.ts
import { Component, inject } from '@angular/core';
import { GeoCountryService } from '@module/shared/geo/country/service';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-geo-country-mutation-page',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [NgComponentOutlet, MatButtonModule, MatIconModule],
})
export class GeoCountryMutationPageComponent {
  public readonly service = inject(GeoCountryService);
}
