import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Task } from '../../../../core/models/task.model';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { TaskService } from '../../../../core/services/task';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { TaskDeleteConfirm, TaskDeleteData } from './task-delete-confirm/task-delete-confirm';
import { TaskDialog } from './task-dialog/task-dialog';

@Component({
  selector: 'app-task',
  imports: [UI_IMPORTS],
  templateUrl: './task.html',
  styleUrl: './task.scss'
})
export class TaskListComponent  {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private errorHandler = inject(ErrorHandler);

  tasks: Task[] = [];
  loading = false;
  filterStatus = 'all';
  filterPriority = 'all';

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: '1', label: 'Pending' },
    { value: '2', label: 'InProgress' },
    { value: '3', label: 'Completed' },
  ];

  priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: '1', label: 'Low' },
    { value: '2', label: 'Medium' },
    { value: '3', label: 'High' },
    { value: '4', label: 'Critical' }
  ];

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.taskService.getAll().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Deleted failed');
      },
      complete: () => this.loading = false
    });
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const taskStatus = task.taskStatusName || '';
      const taskPriority = task.taskPriorityName || '';
      
      const statusMatch = this.filterStatus === 'all' || 
                         (this.filterStatus !== 'all' && taskStatus.toLowerCase() === 
                          this.statusOptions.find(opt => opt.value === this.filterStatus)?.label?.toLowerCase());
      
      const priorityMatch = this.filterPriority === 'all' || 
                           (this.filterPriority !== 'all' && taskPriority.toLowerCase() === 
                            this.priorityOptions.find(opt => opt.value === this.filterPriority)?.label?.toLowerCase());
      
      return statusMatch && priorityMatch;
    });
  }

  openDialog(task?: Task) {
    const dialogRef = this.dialog.open(TaskDialog, {
      width: '600px',
      data: task ? { ...task } : null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  deleteTask(task: Task) {
    const taskData: TaskDeleteData = {
      taskItemId: task.taskItemId,
      taskName: task.taskName,
      projectName: task.projectName,
      assignedToEmployeeName: task.assignedToEmployeeName,
      deadline: task.deadline,
      taskPriorityName: task.taskPriorityName,
      taskStatusName: task.taskStatusName,
      description: task.description,
      taskTypeName: task.taskTypeName
    };
  
    const dialogRef = this.dialog.open(TaskDeleteConfirm, {
      width: '500px',
      data: taskData
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.confirmed) {
        this.performDelete(task.taskItemId, result.reason);
      }
    });
  }

  // Adding the missing performDelete method
  private performDelete(id: number, reason?: string) {
    this.taskService.delete(id).subscribe({
      next: () => {
        this.toastr.success('Task deleted successfully', 'Success');
        if (reason) {
          console.log('Deletion reason:', reason);
        }
        this.loadTasks();
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Deleted failed');
      }
    });
  }

  getPriorityClass(priorityName: string | undefined): string {
    if (!priorityName) return 'priority-default';
    switch (priorityName.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'critical': return 'priority-critical';
      default: return 'priority-default';
    }
  }

  getStatusClass(statusName: string | undefined): string {
    if (!statusName) return 'status-default';
    switch (statusName.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'inprogress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'blocked': return 'status-blocked';
      default: return 'status-default';
    }
  }
}