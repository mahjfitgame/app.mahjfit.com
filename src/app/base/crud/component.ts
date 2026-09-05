// file: src/app/base/crud/component.ts
import {
  Component,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudService } from '@base/crud/service';
import { CrudDefaultModule } from '@base/crud/default/module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-crud',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    // routs
    RouterModule,
    CommonModule,

    MatSnackBarModule,
    MatBottomSheetModule,
    MatSidenavModule,

    // for parent private area layout slot
    CdkPortal,
    PrivateAreaLayoutDirective,

    // custom components
    CrudDefaultModule,
  ],
  providers: [],
})
export class CrudComponent implements OnInit, OnDestroy {
  public readonly service = inject(CrudService);
  private readonly injector = inject(Injector);

  constructor() {
    this.service.setComponentInjector(this.injector);
  }

    public ngOnInit(): void {}
    public ngOnDestroy(): void {
        this.service.paLayout.state.setDefault();
    }
}
