// file: ./src/app/base/crud/component.ts
import {
  Component,
  DestroyRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudService } from '@base/crud/service';
import { CrudDefaultModule } from '@base/crud/default/module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
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
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.service.setComponentInjector(this.injector);
    this.service.initCrudActionFromUrl();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.service.initCrudActionFromUrl();
      });
  }

    public ngOnInit(): void {
        this.service.initI18n();
    }
    public ngOnDestroy(): void {
        this.service.paLayout.state.setDefault();
    }
}
