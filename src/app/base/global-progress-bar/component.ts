import { AfterViewInit, Component, OnDestroy, inject, viewChild } from '@angular/core';
import { ProgressBarComponent } from '@base/progress-bar/component';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';

@Component({
  selector: 'app-global-progress-bar',
  standalone: true,
  imports: [ProgressBarComponent],
  providers: [],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class GlobalProgressBarComponent implements AfterViewInit, OnDestroy {
  private readonly service = inject(GlobalProgressBarService);
  private readonly progressBar = viewChild.required<ProgressBarComponent>('GlobalProgressBar');

  public ngAfterViewInit(): void {
    this.service.pbRegister(this.progressBar().service);
  }

  public ngOnDestroy(): void {
    this.service.pbUnregister(this.progressBar().service);
  }
}
