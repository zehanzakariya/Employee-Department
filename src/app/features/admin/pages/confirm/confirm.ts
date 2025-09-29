import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface StatusChangeData {
  employee: any;
  isActivating: boolean;
}

@Component({
  selector: 'app-confirm',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss'
})
export class ConfirmDialog {
  reason: string = '';
  loading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: StatusChangeData
  ) {}

  confirm(): void {
    this.loading = true;
    this.dialogRef.close({ confirmed: true, reason: this.reason });
  }
  onCancel(): void {
    this.dialogRef.close(false);
  }
}