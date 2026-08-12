// file: src/app/area/auth/directive.ts
import { AfterViewInit, Directive, Input, OnDestroy, inject, input } from '@angular/core';
import { CdkPortal } from '@angular/cdk/portal';
import { AuthAreaLayoutStateRuntimeEnum } from '@area/auth/enum';
import { AuthAreaLayoutState } from '@area/auth/state';

@Directive({
  selector: 'ng-template[authAreaLayout][cdkPortal]',
  standalone: true,
})
export class AuthAreaLayoutDirective implements AfterViewInit, OnDestroy {
  public readonly authAreaLayout = input.required<AuthAreaLayoutStateRuntimeEnum>({
    alias: 'authAreaLayout',
  });

  protected readonly portal = inject(CdkPortal);
  protected readonly authAreaLayoutState = inject(AuthAreaLayoutState);

  public ngAfterViewInit(): void {
    this.authAreaLayoutState.set(this.authAreaLayout(), this.portal);
  }

  public ngOnDestroy(): void {
    this.authAreaLayoutState.clear(this.authAreaLayout(), this.portal);
  }
}