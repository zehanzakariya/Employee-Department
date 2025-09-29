import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UI_IMPORTS } from '../../../../../shared/ui-imports.ts/ui-imports.ts';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
@Component({
  selector: 'app-confirmation-dialog',
  imports: [...UI_IMPORTS, MatDialogModule, MatButtonModule],
  template: `
  <div class="confirmation-dialog">
  <h2 mat-dialog-title>{{ data.title }}</h2>
  
  <mat-dialog-content>
    <p>{{ data.message }}</p>
  </mat-dialog-content>

  <mat-dialog-actions align="center">
    <button mat-button (click)="onCancel()">
      {{ data.cancelText || 'Cancel' }}
    </button>
    <button mat-raised-button color="warn" (click)="onConfirm()">
      {{ data.confirmText || 'Confirm' }}
    </button>
  </mat-dialog-actions>
</div>
`,
styles: [`
.confirmation-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  text-align: center;
  max-width: 350px;
  width: 100%;
  overflow: hidden;
}

h2[mat-dialog-title] {
  margin: 0 0 16px 0;
  font-size: 1.4rem;
  font-weight: 500;
  color: #1a1a1a;
}

mat-dialog-content {
  width: 100%;
}

mat-dialog-content p {
  margin: 0;
  font-size: 1rem;
  color: #555;
  line-height: 1.5;
  word-wrap: break-word;
}

mat-dialog-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding: 0;
  width: 100%;
}

button {
  min-width: 100px;
}
`]
})
export class ConfirmationDialogComponent {
  public dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  public data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}