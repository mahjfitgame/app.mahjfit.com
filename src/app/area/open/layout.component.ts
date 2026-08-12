// file: src/app/area/open/layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-open-area-layout',
  standalone: true,
  templateUrl: './layout.template.html',
  styleUrl: './layout.style.scss',
  imports: [RouterOutlet],
})
export class OpenAreaLayoutComponent { }
