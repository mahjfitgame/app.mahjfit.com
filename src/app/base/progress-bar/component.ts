import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressBarService } from '@base/progress-bar/service';
import { ProgressBarState } from '@base/progress-bar/state';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [MatProgressBarModule],
  providers: [ProgressBarState, ProgressBarService],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class ProgressBarComponent {
  public readonly service = inject(ProgressBarService);
}