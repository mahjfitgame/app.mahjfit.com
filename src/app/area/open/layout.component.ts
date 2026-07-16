// ./src/app/area/open/layout.component.ts
import { Component, DOCUMENT, inject, OnDestroy, OnInit, Renderer2, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { AppConfigRepository } from "@libs/sqlite/module/app-config/repository";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { InternationalizationComponent } from "@base/internationalization/component";
import { ThemeComponent } from "@base/theme/component";
import { ClientSessionService } from "@libs/client-session/service";
@Component({
  selector: 'app-open-area-layout',
  standalone: true,
  templateUrl: './layout.template.html',
  styleUrl: './layout.style.scss',
  imports: [
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,

    ThemeComponent,
    InternationalizationComponent,
  ],
  providers: [
    
  ],
})
export class OpenAreaLayoutComponent implements OnInit, OnDestroy {
    
    public dbVersion = signal('N/A');
    public readonly appConfigRepository = inject(AppConfigRepository)

    protected readonly navLinks = [
        { label: "Sign In", path: "/auth/signin", icon: "lock_open" },
        { label: "Already signed in? Go to Geo Country", path: "/account/geo/country", icon: "dashboard" },
        { label: "Start Game", path: "/buss/game-start", icon: "gamepad" },
    ];

    protected readonly brandLogoSrc = "assets/logo.png";

    // framework
    private router = inject(Router);
    private renderer = inject(Renderer2);
    private document = inject(DOCUMENT);
    
    
    // libs
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    public readonly session = inject(ClientSessionService);

    // third party

    // component

    constructor() {
    }
  
    public async ngOnInit(): Promise<void> {
       this.dbVersion.set(await this.appConfigRepository.getCurrentSqliteDbVersion());
    }

    public async ngOnDestroy() {
    }
}