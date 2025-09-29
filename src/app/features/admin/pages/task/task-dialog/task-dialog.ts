import { Component, Inject, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EmployeeReadDto } from '../../../../../core/models/employee.model';
import { Project } from '../../../../../core/models/project.model';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../../../../../core/models/task.model';
import { Employee } from '../../../../../core/services/employee.service';
import { ErrorHandler } from '../../../../../core/services/error-handler';
import { projectService } from '../../../../../core/services/project.service';
import { TaskService } from '../../../../../core/services/task';
import { UI_IMPORTS } from '../../../../../shared/ui-imports.ts/ui-imports.ts';

@Component({
  selector: 'app-task-dialog',
  imports: [...UI_IMPORTS],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.scss'
})
export class TaskDialog {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(projectService);
  private employeeService = inject(Employee);
  private toastr = inject(ToastrService);
  public dialogRef = inject(MatDialogRef<TaskDialog>);
  private errorHandler = inject(ErrorHandler);

  projects: Project[] = [];
  employees: EmployeeReadDto[] = [];
  loading = false;
  minDate: Date = new Date();

  readonly TASK_NAME_MAX_LENGTH = 100;
  readonly DESCRIPTION_MAX_LENGTH = 500;

  priorities = [
    { taskPriorityId: 1, taskPriorityName: 'Low' },
    { taskPriorityId: 2, taskPriorityName: 'Medium' },
    { taskPriorityId: 3, taskPriorityName: 'High' },
    { taskPriorityId: 4, taskPriorityName: 'Critical' }
  ];

  types = [
    { taskTypeId: 1, taskTypeName: 'Task' },
    { taskTypeId: 2, taskTypeName: 'Bug' },
  ];

  statuses = [
    { taskStatusId: 1, taskStatusName: 'Pending' },
    { taskStatusId: 2, taskStatusName: 'InProgress' },
    { taskStatusId: 3, taskStatusName: 'Completed' },
  ];

  form = this.fb.group({
    taskName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(this.TASK_NAME_MAX_LENGTH),
      Validators.pattern(/^[a-zA-Z0-9\s\-_.,!?()[\]]+$/)
    ]],
    projectId: [null as number | null, [
      Validators.required, 
      this.positiveNumberValidator
    ]],
    assignedToEmployeeId: [null as number | null, [
      Validators.required, 
      this.positiveNumberValidator
    ]],
    deadline: [new Date(), [
      Validators.required, 
      this.futureDateValidator
    ]],
    taskPriorityId: [2, [
      Validators.required, 
      this.positiveNumberValidator
    ]],
    description: ['', [
      Validators.maxLength(this.DESCRIPTION_MAX_LENGTH),
      Validators.pattern(/^[a-zA-Z0-9\s\-_.,!?()[\]]*$/) 
    ]],
    taskTypeId: [null as number | null, [
      Validators.required,
      this.positiveNumberValidator   
    ]],
    
    taskStatusId: [1, [
      Validators.required, 
      this.positiveNumberValidator
    ]]
  });

  // getters for faster template access
  get taskName() { return this.form.get('taskName'); }
  get projectId() { return this.form.get('projectId'); }
  get assignedToEmployeeId() { return this.form.get('assignedToEmployeeId'); }
  get deadline() { return this.form.get('deadline'); }
  get taskPriorityId() { return this.form.get('taskPriorityId'); }
  get description() { return this.form.get('description'); }
  get type() { return this.form.get('type'); }
  get taskTypeId() { return this.form.get('taskTypeId'); }

  get taskStatusId() { return this.form.get('taskStatusId'); }

  constructor(@Inject(MAT_DIALOG_DATA) public data: Task | null) {}

  // Custom validator for positive numbers (greater than 0)
  private positiveNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return { positiveNumber: true };
    }
    return null;
  }

  // Custom validator to ensure date is not in the past
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  }

  // Custom validator for minimum date 
  private minDateValidator(minDate: Date) {
    return (control: AbstractControl): ValidationErrors | null => {
      const selectedDate = new Date(control.value);
      if (selectedDate < minDate) {
        return { minDate: true };
      }
      return null;
    };
  }

  ngOnInit() {
    this.loadProjects();
    this.loadEmployees();
  
    if (this.data) {
      const deadline = new Date(this.data.deadline);
      const validDeadline = deadline >= new Date() ? deadline : new Date();
  
      const status = this.statuses.find(s => s.taskStatusName === this.data?.taskStatusName);
      const priority = this.priorities.find(p => p.taskPriorityName === this.data?.taskPriorityName);
  
      this.form.patchValue({
        taskName: this.data.taskName || '',
        deadline: validDeadline,
        taskPriorityId: priority?.taskPriorityId ?? 2,  
        description: this.data.description || '',
        taskTypeId: this.data.taskTypeId || null,
        taskStatusId: status?.taskStatusId ?? 1,       
      });
    }
  }
  
  

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
        if (this.data && this.data.projectName) {
          const project = this.projects.find(p => 
            p.projectName === this.data!.projectName
          );
          
          if (project) {
            this.form.get('projectId')?.setValue(project.projectId);
          } else {
            console.warn('Project not found:', this.data.projectName);
            this.toastr.warning(
              `Project "${this.data.projectName}" not found in available projects`,
              'Project Warning',
              { timeOut: 4000 }
            );
          }
        }
      },
      error: () => {
        this.toastr.error('Failed to load projects', 'Error');
      }
    });
  }

  loadEmployees() {
    this.employeeService.me().subscribe({
      next: (employees: EmployeeReadDto[]) => {
        this.employees = employees;
        if (this.data && this.data.assignedToEmployeeName) {
          const employee = this.employees.find(e => 
            e.fullName === this.data!.assignedToEmployeeName
          );
          
          if (employee) {
            this.form.get('assignedToEmployeeId')?.setValue(employee.employeeId);
          } else {
            console.warn('Employee not found:', this.data.assignedToEmployeeName);
            this.toastr.warning(
              `Employee "${this.data.assignedToEmployeeName}" not found in available employees`,
              'Employee Warning',
              { timeOut: 4000 }
            );
          }
        }
      },
      error: () => {
        this.toastr.error('Failed to load employees', 'Error');
      }
    });
  }

  getValidationMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['pattern']) return 'Invalid format';
    if (errors['positiveNumber']) return 'Please select a valid option';
    if (errors['pastDate']) return 'Date cannot be in the past';
    if (errors['minDate']) return 'Date is too early';

    return 'Invalid value';
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Showing error message
      const invalidFields = Object.keys(this.form.controls)
        .filter(key => this.form.get(key)?.invalid)
        .map(key => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())); // Converting camelCase to Title Case
      
      if (invalidFields.length > 0) {
        this.toastr.error(
          `Please fix the following fields: ${invalidFields.join(', ')}`,
          'Validation Error',
          { timeOut: 5000 }
        );
      }
      
      return;
    }

    this.loading = true;
    const formValue = this.form.getRawValue();

    
    const payload: TaskCreateRequest = {
      taskName: formValue.taskName!.trim(),
      projectId: formValue.projectId!,
      assignedToEmployeeId: formValue.assignedToEmployeeId!,
      deadline: formValue.deadline!,
      taskPriorityId: formValue.taskPriorityId!,
      description: formValue.description?.trim() || '',
      taskTypeId: formValue.taskTypeId!,
      taskStatusId: formValue.taskStatusId!,
    };

    const request = this.data
    ? this.taskService.update(this.data.taskItemId, {
        taskItemId: this.data.taskItemId,
        taskName: formValue.taskName!.trim(),
        deadline: formValue.deadline!,
        taskPriorityId: formValue.taskPriorityId!,
        description: formValue.description?.trim() || '',
        taskTypeId: formValue.taskTypeId!,
        taskStatusId: formValue.taskStatusId!,
        assignedToEmployeeId: formValue.assignedToEmployeeId,
        projectId:formValue.projectId
      } as TaskUpdateRequest)
    : this.taskService.create(payload);
  
    request.subscribe({
      next: () => {
        this.toastr.success(`Task ${this.data ? 'updated' : 'created'} successfully`, 'Success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Login failed');
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
}