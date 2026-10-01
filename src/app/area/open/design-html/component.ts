// file: src/app/area/open/design-html/component.ts
import { Component } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

/**
 * @DesignHtmlComponent
 *
 * This component is used to design html layout
 */
@Component({
    selector: 'design-html-component',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [MatIconModule, MatButtonModule, MatDividerModule, MatMenuModule],
})
export class DesignHtmlComponent {}
