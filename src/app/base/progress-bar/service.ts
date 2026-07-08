import { Service, inject } from '@angular/core';
import { ProgressBarStatusEnum } from '@base/progress-bar/enum';
import { ProgressBarState } from '@base/progress-bar/state';

@Service({ autoProvided: false })
export class ProgressBarService {
  private readonly state = inject(ProgressBarState);
  public readonly visible = this.state.visible;

  /**
   * Start the progress bar. If the progress bar is already running, returns the timestamp when it was started.
   * Otherwise, starts the progress bar and returns the timestamp when it was started.
   * @returns The timestamp when the progress bar was started.
   */
  public start(): number {
    return this.state.start();
  }

  /**
   * Completes the progress bar, lets the 100% state render, then hides it.
   * @returns An array containing the
   *    duration of the progress bar in milliseconds,
   *    the timestamp when the progress bar was stopped,
   *    and the timestamp when the progress bar was started.
   */
  public stop(): [number, number, number] {
    return this.state.stop();
  }

  /**
   * The current progress value of the progress bar.
   * This value is between 0 and 100.
   * If the progress bar is not running, returns 0.
   * @returns The current progress value of the progress bar.
   */
  public get stream(): number {
    return this.state.stream();
  }

  /**
   * Sets the current progress value of the progress bar.
   * This value should be between 0 and 100.
   * Values outside the valid range are clamped to 0-100.
   * @param progress - The current progress value of the progress bar
   */
  public set stream(progress: number) {
    this.state.setStream(progress);
  }

  public get status(): ProgressBarStatusEnum {
    return this.state.status();
  }

  public get processing(): boolean {
    return this.state.isProcessing;
  }
}
