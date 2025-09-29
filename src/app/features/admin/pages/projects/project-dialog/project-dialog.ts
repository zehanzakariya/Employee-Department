import { Component, Inject, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Department } from '../../../../../core/models/dept.model';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../../../../../core/models/project.model';
import { Dept } from '../../../../../core/services/dept.service';
import { ErrorHandler } from '../../../../../core/services/error-handler';
import { projectService } from '../../../../../core/services/project.service';
import { UI_IMPORTS } from '../../../../../shared/ui-imports.ts/ui-imports.ts';

export function lettersAndSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // validator FOR handlING empty values
    }
    
    const lettersSpacesRegex = /^[A-Za-z\s]*$/;
    
    if (!lettersSpacesRegex.test(value)) {
      return { pattern: true };
    }
    
    return null;
  };
}

// Custom validator for first character as letter
export function firstCharacterLetterValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.length === 0) {
      return null; // Let required validator handle empty values
    }
    
    const firstChar = value.charAt(0);
    const letterRegex = /^[A-Za-z]$/;
    
    if (!letterRegex.test(firstChar)) {
      return { firstCharacterLetter: true };
    }
    
    return null;
  };
}
@Component({
  selector: 'app-project-dialog',
  imports: [...UI_IMPORTS],
  templateUrl: './project-dialog.html',
  styleUrl: './project-dialog.scss'
})
export class ProjectDialog {
  private fb = inject(FormBuilder);
  private projectService = inject(projectService);
  private deptService = inject(Dept);
  private toastr = inject(ToastrService);
  public dialogRef = inject(MatDialogRef<ProjectDialog>);
  private errorHandler = inject(ErrorHandler);

  departments: Department[] = [];
  minDate: Date = new Date();
  loading = false;

  readonly PROJECT_NAME_MAX_LENGTH = 200; // Changed from 50 to 200
  readonly DESCRIPTION_MAX_LENGTH = 500;

  form = this.fb.group({
    projectName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(this.PROJECT_NAME_MAX_LENGTH),
      lettersAndSpacesValidator(), // Custom validator for letters and spaces only
      firstCharacterLetterValidator() // Custom validator for first character as letter
    ]],
    description: ['', [
      Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)
      // Removed pattern validator since description is optional and can contain any characters
    ]],
    deadline: [new Date(), [
      Validators.required, 
      this.futureDateValidator
    ]],
    departmentId: [null as number | null, [
      Validators.required
      // Removed positiveNumberValidator since departmentId should be validated by required only
    ]]
  });

  // Getters for faster access
  get projectName() { return this.form.get('projectName'); }
  get description() { return this.form.get('description'); }
  get deadline() { return this.form.get('deadline'); }
  get departmentId() { return this.form.get('departmentId'); }

  constructor(@Inject(MAT_DIALOG_DATA) public data: Project | null) {}

  // Custom validator for ensuring date is not in the past
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  }

  ngOnInit() {
    if (this.data) {
      const deadline = new Date(this.data.deadline);
      const validDeadline = deadline >= new Date() ? deadline : new Date();
      
      this.form.patchValue({
        projectName: this.data.projectName,
        description: this.data.description || '',
        deadline: validDeadline,
        departmentId: this.data.departmentId
      });
    }

    this.deptService.list().subscribe({
      next: (depts) => (this.departments = depts),
      error: () => this.toastr.error('Failed to load departments', 'Error')
    });
  }

  getValidationMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['pattern']) return 'Only letters and spaces are allowed';
    if (errors['firstCharacterLetter']) return 'First character must be a letter';
    if (errors['pastDate']) return 'Date cannot be in the past';
    if (errors['positiveNumber']) return 'Please select a valid option';
    if (errors['min']) return 'Please select a valid option';

    return 'Invalid value';
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Showing comprehensive error message
      const invalidFields = Object.keys(this.form.controls)
        .filter(key => this.form.get(key)?.invalid)
        .map(key => {
          const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return fieldName === 'Department Id' ? 'Department' : fieldName;
        });
      
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
    
    const payload: ProjectCreateRequest = {
      projectName: formValue.projectName!.trim(),
      description: formValue.description?.trim() || '',
      deadline: formValue.deadline!,
      departmentId: formValue.departmentId!
    };

    const request = this.data
      ? this.projectService.update(this.data.projectId, { 
          ...payload, 
          projectId: this.data.projectId,
          projectStatusId: this.data.projectStatusId || 1 
        } as ProjectUpdateRequest)
      : this.projectService.create(payload);

    request.subscribe({
      next: () => {
        this.toastr.success(`Project ${this.data ? 'updated' : 'created'} successfully`, 'Success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Project operation failed');
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
}