// ./src/app/module/shared/http-status/under-maintenance/component.ts
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { UtilityService } from "@libs/utility/service";
import { DomObserverService } from "@libs/dom-observer/service";
import { UnderMaintenanceService } from "@module/shared/http-status/under-maintenance/service";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDividerModule } from "@angular/material/divider";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { ThemeService } from "@base/theme/service";
import { ThemePreferenceEnum } from "@base/theme/type";
import { THEME_PREFERENCE_OPTIONS } from "@base/theme/const";
@Component({
  selector: 'app-under-maintenance',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule,
  ],
  providers: [
    UnderMaintenanceService
  ],
})
export class UnderMaintenanceComponent implements  OnInit, OnDestroy, AfterViewInit { 
    private observer: MutationObserver | null = null;

    // framework
    private readonly el = inject(ElementRef<HTMLElement>);
    
    // libs
    protected readonly theme = inject(ThemeService);
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly util = inject(UtilityService);
    private readonly domObserver = inject(DomObserverService);

    // third party

    // component
    protected readonly themePreferenceOptions = THEME_PREFERENCE_OPTIONS;

    // service
    protected service = inject(UnderMaintenanceService);

    constructor() {
    }
    public async ngOnInit() {
      this.setupDomObserver();
    }
    public async ngOnDestroy() {
      this.domObserver.disconnectObserver(this.observer);
      this.observer = null;
    }
    public async ngAfterViewInit() {
      this.util.processCoverImages(this.el.nativeElement);
    }

    protected onThemePreferenceChange(themePreference: ThemePreferenceEnum): void {
      this.theme.state.setThemePreference(themePreference);
    }

    private setupDomObserver(): void {
      // create call back on dom change
      const callBack = () => {
        this.util.processCoverImages(this.el.nativeElement);
      };

      this.observer = this.domObserver.createMutationObserver(
        this.el.nativeElement, 
        callBack,
        {
          runImmediately: true,
          debounceMs: 50,
          config: {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
          },
        },
      );
    }
}
