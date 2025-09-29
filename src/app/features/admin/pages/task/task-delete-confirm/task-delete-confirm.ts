import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UI_IMPORTS } from '../../../../../shared/ui-imports.ts/ui-imports.ts';
export interface TaskDeleteData {
  taskItemId: number;
  taskName: string;
  projectName?: string;
  assignedToEmployeeName?: string;
  deadline: Date | string;
  taskPriorityName?: string;
  taskStatusName?: string;
  description?: string;
  taskTypeName?: string;
}
@Component({
  selector: 'app-task-delete-confirm',
  imports: [UI_IMPORTS,MatDialogModule,DatePipe,MatIconModule,],
  templateUrl: './task-delete-confirm.html',
  styleUrl: './task-delete-confirm.scss'
})
export class TaskDeleteConfirm {
  readonly dialogRef = inject(MatDialogRef<TaskDeleteConfirm>);
  readonly data: TaskDeleteData = inject(MAT_DIALOG_DATA);
  
  reason: string = '';
  loading = false;

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.loading = true;
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason
    });
  }
}