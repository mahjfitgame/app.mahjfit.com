import { Component, inject } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
  MatSnackBarLabel,
  MatSnackBarActions,
  MatSnackBarAction,
} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SnackBarDataType } from '@base/snack-bar/type';
import { NgClass } from '@angular/common';
import { SnackBarTypeEnum } from '@base/snack-bar/enum';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction,
    NgClass,
  ],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class SnackBarComponent {
  // Inject the snackbar reference and the custom data
  protected snackBarRef = inject(MatSnackBarRef);
  public data: SnackBarDataType = inject(MAT_SNACK_BAR_DATA);

  protected SnackBarTypeEnum = SnackBarTypeEnum;
}
