import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeReadDto } from '../../../../core/models/employee.model';
import { TaskStatus, TaskUpdateRequest, TaskUpdateStatusRequest } from '../../../../core/models/task.model';
import { Auth } from '../../../../core/services/auth.service';
import { Employee } from '../../../../core/services/employee.service';
import { EmployeeTasksResponse, TaskService } from '../../../../core/services/task';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';

interface TaskStatuses {
  taskStatusId: number;
  taskStatusName: string;
}
interface TaskPriority {
  taskPriorityId: number;
  priorityName: string;
}
@Component({
  selector: 'app-task-view',
  imports: [UI_IMPORTS,DatePipe],
  templateUrl: './task-view.html',
  styleUrl: './task-view.scss'
})
export class TaskView {
  private taskService = inject(TaskService);
  private auth = inject(Auth);
  private employeeService = inject(Employee);
  private snackBar = inject(MatSnackBar);

  loading = false;
  employeeTasks: EmployeeTasksResponse | null = null;
  error: string | null = null;
  currentEmployee: EmployeeReadDto | null = null;
  updatingStatus = false;

  // Status options
  availableStatuses: TaskStatuses[] = [
    { taskStatusId: 1, taskStatusName: 'Pending' },
    { taskStatusId: 2, taskStatusName: 'InProgress' },
    { taskStatusId: 3, taskStatusName: 'Completed' }
  ];

  // Priority mapping
  priorityMap: { [key: string]: string } = {
    'low': 'Low',
    'medium': 'Medium', 
    'high': 'High',
    'critical': 'Critical',
    'unknown': 'Unknown'
  };

  // Completed status ID - make it a constant for easy reference
  private readonly COMPLETED_STATUS_ID = 3;

  ngOnInit() {
    this.loadCurrentEmployee();
  }

  loadCurrentEmployee() {
    this.loading = true;
    this.error = null;

    this.employeeService.me().subscribe({
      next: (employees) => {
        const userEmail = this.auth.user?.email;
        if (userEmail && employees.length > 0) {
          this.currentEmployee = employees.find(emp => emp.email === userEmail) || null;
          
          if (this.currentEmployee && this.currentEmployee.employeeId) {
            this.loadEmployeeTasks(this.currentEmployee.employeeId);
          } else {
            this.error = 'Current employee not found';
            this.loading = false;
          }
        } else {
          this.error = 'User email not found or no employees available';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading current employee:', error);
        this.error = 'Failed to load employee information';
        this.loading = false;
      }
    });
  }

  loadEmployeeTasks(employeeId: number) {
    this.taskService.getByEmployee(employeeId).subscribe({
      next: (response) => {
        const tasksWithProperNames = this.ensureTaskDataQuality(response);
        this.employeeTasks = { ...response, tasks: tasksWithProperNames };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employee tasks:', error);
        this.error = 'Failed to load tasks';
        this.loading = false;
      }
    });
  }

  // Check if task is completed
  isTaskCompleted(task: any): boolean {
    return task.taskStatusId === this.COMPLETED_STATUS_ID || 
           task.taskStatusName?.toLowerCase() === 'completed';
  }

  // Ensure task data has proper status and priority names
  private ensureTaskDataQuality(response: EmployeeTasksResponse): any[] {
    return response.tasks.map(task => ({
      ...task,
      taskStatusName: this.getProperStatusName(task.taskStatusName, task.taskStatusId),
      taskPriorityName: this.getProperPriorityName(task.taskPriorityName),
      // Ensure taskStatusId is properly set for completed tasks
      taskStatusId: this.getProperStatusId(task.taskStatusName, task.taskStatusId)
    }));
  }

  // Map status ID to proper status name
  private getProperStatusName(statusName: string | undefined, statusId: number | undefined): string {
    if (statusName && statusName !== 'Unknown') {
      return statusName;
    }
    
    if (statusId) {
      const status = this.availableStatuses.find(s => s.taskStatusId === statusId);
      return status?.taskStatusName || 'Unknown';
    }
    
    return 'Unknown';
  }

  // Ensure status ID is properly set (especially for completed tasks)
  private getProperStatusId(statusName: string | undefined, statusId: number | undefined): number {
    if (statusId) return statusId;
    
    if (statusName?.toLowerCase() === 'completed') {
      return this.COMPLETED_STATUS_ID;
    }
    
    // Default to Pending if no ID is found
    return 1;
  }

  // Ensure priority name is properly formatted
  private getProperPriorityName(priorityName: string | undefined): string {
    if (!priorityName) return 'Unknown';
    
    const lowerCaseName = priorityName.toLowerCase();
    return this.priorityMap[lowerCaseName] || this.capitalizeFirstLetter(priorityName);
  }

  // Method to capitalize first letter
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Get status ID from status name for dropdown value
  getStatusId(statusName: string | undefined): number {
    if (!statusName) return 1;
    
    const status = this.availableStatuses.find(s => 
      s.taskStatusName.toLowerCase() === statusName.toLowerCase()
    );
    return status?.taskStatusId || 1;
  }

  // Get display name for priority
  getPriorityDisplayName(priorityName: string | undefined): string {
    if (!priorityName) return 'Unknown';
    return this.priorityMap[priorityName.toLowerCase()] || this.capitalizeFirstLetter(priorityName);
  }

  // Get available statuses based on current status
  getAvailableStatuses(task: any): TaskStatuses[] {
    // If task is completed, only show Completed status
    if (this.isTaskCompleted(task)) {
      return this.availableStatuses.filter(status => status.taskStatusId === this.COMPLETED_STATUS_ID);
    }
    
    // For other statuses, allow all statuses
    return this.availableStatuses;
  }

  // Handle status change from dropdown
  onStatusChange(task: any, newStatusId: number) {
    // Prevent updating if the status hasn't actually changed
    if (task.taskStatusId === newStatusId) {
      return;
    }

    // Prevent any changes to completed tasks
    if (this.isTaskCompleted(task)) {
      this.snackBar.open('Cannot change status of completed tasks', 'Close', { 
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    // Prevent going back from Completed status (additional safety)
    if (task.taskStatusId === this.COMPLETED_STATUS_ID && newStatusId !== this.COMPLETED_STATUS_ID) {
      this.snackBar.open('Cannot change status from Completed', 'Close', { 
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    this.updateTaskStatus(task, newStatusId);
  }

  // Method to update task status
  updateTaskStatus(task: any, newStatusId: number) {
    this.updatingStatus = true;

    const updateStatusRequest: TaskUpdateStatusRequest = {
      taskItemId: task.taskItemId,
      taskStatusId: newStatusId
    };

    this.taskService.updateStatus(updateStatusRequest).subscribe({
      next: (updatedTask) => {
        this.updatingStatus = false;
        
        // Update the task in the local array
        if (this.employeeTasks && this.employeeTasks.tasks) {
          const taskIndex = this.employeeTasks.tasks.findIndex(t => t.taskItemId === task.taskItemId);
          if (taskIndex !== -1) {
            const newStatusName = this.availableStatuses.find(s => s.taskStatusId === newStatusId)?.taskStatusName || 'Unknown';
            
            this.employeeTasks.tasks[taskIndex] = {
              ...this.employeeTasks.tasks[taskIndex],
              taskStatusId: newStatusId,
              taskStatusName: newStatusName
            };
          }
        }

        this.snackBar.open('Task status updated successfully!', 'Close', { 
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.updatingStatus = false;
        this.snackBar.open('Failed to update task status', 'Close', { 
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  // Check if task can be updated
  canUpdateTask(task: any): boolean {
    return !this.updatingStatus && !this.isTaskCompleted(task);
  }

  // Priority class methods
  getPriorityClass(taskPriorityName: string | null | undefined): string {
    if (!taskPriorityName) return 'task-priority-unknown';
    
    const priorityMap: { [key: string]: string } = {
      'low': 'task-priority-low',
      'medium': 'task-priority-medium',
      'high': 'task-priority-high',
      'critical': 'task-priority-critical'
    };
    
    return priorityMap[taskPriorityName.toLowerCase()] || 'task-priority-unknown';
  }

  getStatusClass(taskStatusName: string | undefined): string {
    if (!taskStatusName) return 'status-unknown';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'inprogress': 'status-inprogress',
      'progress': 'status-progress',
      'completed': 'status-completed',
      'blocked': 'status-blocked'
    };
    
    return statusMap[taskStatusName.toLowerCase()] || 'status-unknown';
  }

  getDisplayPriority(taskPriorityName: string | null | undefined): string {
    if (!taskPriorityName) return 'Unknown';
    return taskPriorityName.charAt(0).toUpperCase() + taskPriorityName.slice(1).toLowerCase();
  }

  refreshTasks() {
    if (this.currentEmployee?.employeeId) {
      this.loadEmployeeTasks(this.currentEmployee.employeeId);
    } else {
      this.loadCurrentEmployee();
    }
  }
}