import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { CdkPortal } from '@angular/cdk/portal';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'crud-view-page-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CdkPortal, NgComponentOutlet, TranslocoModule, MatButtonModule, MatIconModule, MatDividerModule, PrivateAreaLayoutDirective],
})
export class CrudViewPageComponent {
  public readonly service = inject(CrudService);

  /** Record wrapper this host prints — the Print button passes it straight from the template. */
  private readonly printAreaRef = viewChild.required<ElementRef<HTMLElement>>('printArea');

  constructor() {
    // The /print/:keyid route prints without anyone clicking a button, so the
    // service has no element to work from — hand it this host's wrapper. This
    // host is the one the print route renders (see component/view/template.html).
    afterNextRender(() => {
      this.service.view.setAutoPrintArea(this.printAreaRef().nativeElement);
    });

    // Dropped on the way out so a later print can never reach this detached DOM.
    inject(DestroyRef).onDestroy(() => this.service.view.setAutoPrintArea(null));
  }
}
