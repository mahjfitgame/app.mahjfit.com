import { AfterViewInit, Component, inject, OnDestroy, viewChild } from '@angular/core';
import { ProgressBarComponent } from '@base/progress-bar/component';
import { SplashScreenService } from '@base/splash-screen/service';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [ProgressBarComponent],
  providers: [],
  templateUrl: './template.html',
  styleUrl: './style.scss',
  
})
export class SplashScreenComponent implements AfterViewInit, OnDestroy {
  protected readonly service = inject(SplashScreenService);
  private readonly progressBar = viewChild<ProgressBarComponent>('SplashProgressBar');

  public ngAfterViewInit(): void {
    queueMicrotask(() => {
      const pb = this.progressBar();
      if (pb) this.service.pbRegister(pb.service);
    });
  }

  public ngOnDestroy(): void {
    queueMicrotask(() => {
      const pb = this.progressBar();
      if (pb) this.service.pbUnregister(pb.service);
    });
  }
}
