# ProgressBarComponent + ProgressBarService Manual

This manual shows how to use `app-progress-bar` for **multiple independent processes on the same page** (for example 2-3 forms and one data listing API call).

## Why this works for multiple processes

`ProgressBarComponent` has its own `providers: [ProgressBarService]`.
That means every `<app-progress-bar>` instance gets a **unique** `ProgressBarService` instance.

So if one page has 3 forms, each form can have its own progress bar:

- Form A loading does not affect Form B.
- Form B loading does not affect Form C.
- A listing API progress does not affect form progress bars.

---

## API available

From each component instance you can call:

- `start()` → marks process as running (`Date.now()`)
- `stop()` → stops process, hides bar, returns elapsed ms
- `progress(value)`
  - `0` automatically triggers `start()`
  - `100` automatically triggers `stop()`

Template inside progress bar uses:

```html
<mat-progress-bar mode="buffer" [value]="splash.progress()" aria-label="Progress"></mat-progress-bar>
```

---

## Example: 3 forms + 1 list request on same page

### 1) `multi-form-page.component.html`

```html
<section>
  <h3>Profile Form</h3>
  <app-progress-bar #profileBar></app-progress-bar>
  <form (ngSubmit)="submitProfile()">
    <!-- profile fields -->
    <button type="submit">Save Profile</button>
  </form>
</section>

<section>
  <h3>Address Form</h3>
  <app-progress-bar #addressBar></app-progress-bar>
  <form (ngSubmit)="submitAddress()">
    <!-- address fields -->
    <button type="submit">Save Address</button>
  </form>
</section>

<section>
  <h3>Password Form</h3>
  <app-progress-bar #passwordBar></app-progress-bar>
  <form (ngSubmit)="submitPassword()">
    <!-- password fields -->
    <button type="submit">Save Password</button>
  </form>
</section>

<section>
  <h3>Data Listing</h3>
  <app-progress-bar #listBar></app-progress-bar>
  <button type="button" (click)="loadList()">Load List</button>
</section>
```

### 2) `multi-form-page.component.ts`

```ts
import { Component, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProgressBarComponent } from 'src/app/components/progress-bar/component';
import { ApiService } from './api.service';

@Component({
  selector: 'app-multi-form-page',
  standalone: true,
  imports: [ProgressBarComponent],
  templateUrl: './multi-form-page.component.html',
})
export class MultiFormPageComponent {
  @ViewChild('profileBar') private profileBar!: ProgressBarComponent;
  @ViewChild('addressBar') private addressBar!: ProgressBarComponent;
  @ViewChild('passwordBar') private passwordBar!: ProgressBarComponent;
  @ViewChild('listBar') private listBar!: ProgressBarComponent;

  constructor(private readonly api: ApiService) {}

  async submitProfile(): Promise<void> {
    this.profileBar.progress(0);
    try {
      await firstValueFrom(this.api.saveProfile());
      this.profileBar.progress(100);
    } catch {
      this.profileBar.stop();
    }
  }

  async submitAddress(): Promise<void> {
    this.addressBar.start();
    try {
      await firstValueFrom(this.api.saveAddress());
      this.addressBar.progress(100);
    } catch {
      this.addressBar.stop();
    }
  }

  async submitPassword(): Promise<void> {
    this.passwordBar.progress(0);
    try {
      await firstValueFrom(this.api.savePassword());
      this.passwordBar.progress(100);
    } catch {
      this.passwordBar.stop();
    }
  }

  async loadList(): Promise<void> {
    this.listBar.progress(0);
    try {
      await firstValueFrom(this.api.getList());
      this.listBar.progress(100);
    } catch {
      this.listBar.stop();
    }
  }
}
```

---

## Behavior summary

- Each bar is isolated because each `<app-progress-bar>` has its own `ProgressBarService` instance.
- You can run all processes at once (profile + address + password + list) and all bars will update separately.
- `stop()` returns elapsed time if you want to log duration:

```ts
const durationMs = this.profileBar.stop();
console.log('Profile request took', durationMs, 'ms');
```