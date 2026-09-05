// file: src/app/module/shared/geo/country/mutation/form/component.ts
import { Component, inject } from '@angular/core';
import { CrudDefaultMutationFormComponent } from '@base/crud/default/mutation/form/component';
import { GeoCountryService } from '@module/shared/geo/country/service';

@Component({
  selector: 'app-geo-country-mutation-form',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CrudDefaultMutationFormComponent],
})
export class GeoCountryMutationFormComponent {
  // use of this service might create a circular dependency issue as same service import this component
  public readonly service = inject(GeoCountryService);
}
