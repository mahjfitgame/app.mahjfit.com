// file: src/app/base/PushNotification/component.ts
import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Toast, ToastPackage, ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-PushNotification',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class PushNotificationComponent extends Toast {
  public readonly duplicateCount = signal(0);

  public readonly totalDuplicateCount = computed(() => {
    const count = this.duplicateCount();
    return count > 0 ? count + 1 : 0;
  });

  private readonly destroyRef = inject(DestroyRef);
  public constructor(
    protected override toastrService: ToastrService,
    public override toastPackage: ToastPackage,
  ) {
    super();

    this.toastPackage.toastRef
      .countDuplicate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.duplicateCount.set(count);
      });
  }

  public readonly isCountDuplicatesEnabled = computed(() => {
    return !!this.toastrService.toastrConfig.countDuplicates;
  });
}
