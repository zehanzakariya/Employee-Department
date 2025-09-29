import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-rejection-dialog',
  standalone:true,
  imports: [ CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './rejection-dialog.html',
  styleUrl: './rejection-dialog.scss'
})
export class RejectionDialog {
  form: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RejectionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.reason);
    }
  }

  close() {
    this.dialogRef.close(null);
  }
}
