import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { RegisterEmployeeRequest } from '../../../core/models/auth.model';
import { Department } from '../../../core/models/dept.model';
import { Auth } from '../../../core/services/auth.service';
import { Dept } from '../../../core/services/dept.service';
import { ErrorHandler } from '../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../shared/ui-imports.ts/ui-imports.ts';

function noNumbers(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  return /\d/.test(value) ? { noNumbers: true } : null;
}

// Custom validator for no special characters (only letters and spaces)
function onlyLettersAndSpaces(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  
  const lettersSpacesRegex = /^[A-Za-z\s]*$/;
  return !lettersSpacesRegex.test(value) ? { specialCharacters: true } : null;
}

// Custom validator for first character must be a letter (not space)
function firstCharacterLetter(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value || value.length === 0) return null;
  
  const firstChar = value.charAt(0);
  const letterRegex = /^[A-Za-z]$/;
  return !letterRegex.test(firstChar) ? { firstCharacterNotLetter: true } : null;
}

// Custom validator for no consecutive spaces
function noConsecutiveSpaces(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  
  return /\s{2,}/.test(value) ? { consecutiveSpaces: true } : null;
}

// Custom validator for no leading/trailing spaces
function noLeadingTrailingSpaces(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  
  return value !== value.trim() ? { leadingTrailingSpaces: true } : null;
}

function noFutureDate(control: AbstractControl): ValidationErrors | null {
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  return selectedDate > today ? { futureDate: true } : null;
}

function minimumAge(control: AbstractControl): ValidationErrors | null {
  const selectedDate = new Date(control.value);
  const today = new Date();
  const minAgeDate = new Date();
  minAgeDate.setFullYear(today.getFullYear() - 18); 
  
  return selectedDate > minAgeDate ? { underage: true } : null;
}
@Component({
  selector: 'app-register',
  imports: [...UI_IMPORTS],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private fb = inject(FormBuilder);
  private deptsSvc = inject(Dept);
  private auth = inject(Auth);
  private toastr = inject(ToastrService); 
  private errorHandler = inject(ErrorHandler);

  depts: Department[] = [];
  busy = false;
  maxDate: string;

  form: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    dob: FormControl<string>;
    departmentId: FormControl<number>;
    gender: FormControl<'Male' | 'Female' | 'Other'>;
  }>;

  constructor() {
    // Setting max date to today for date of birth field
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    
    this.form = this.fb.group({
      fullName: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50), // Changed from 25 to 50 to match HTML
        noNumbers,
        onlyLettersAndSpaces,
        firstCharacterLetter,
        noConsecutiveSpaces,
        noLeadingTrailingSpaces
      ]),
      email: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]),
      dob: this.fb.nonNullable.control('', [
        Validators.required,
        noFutureDate,
        minimumAge
      ]),
      departmentId: this.fb.nonNullable.control(0, [
        Validators.required,
        Validators.min(1)
      ]),
      gender: this.fb.nonNullable.control<'Male' | 'Female' | 'Other'>('Male', [
        Validators.required
      ])
    });
  }

  ngOnInit() {
    this.deptsSvc.list().subscribe((d) => (this.depts = d));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.hasError('required')) return `${this.formatFieldName(field)} is required`;
    if (control.hasError('minlength')) return `${this.formatFieldName(field)} must be at least ${control.getError('minlength').requiredLength} characters`;
    if (control.hasError('maxlength')) return `${this.formatFieldName(field)} must be at most ${control.getError('maxlength').requiredLength} characters`;
    if (control.hasError('email')) return `Please enter a valid email address`;
    if (control.hasError('min')) return `Please select a ${this.formatFieldName(field).toLowerCase()}`;
    if (control.hasError('noNumbers')) return `Numbers are not allowed in ${this.formatFieldName(field).toLowerCase()}`;
    if (control.hasError('specialCharacters')) return `${this.formatFieldName(field)} can only contain letters and spaces`;
    if (control.hasError('firstCharacterNotLetter')) return `First character must be a letter (not space)`;
    if (control.hasError('consecutiveSpaces')) return `Multiple consecutive spaces are not allowed`;
    if (control.hasError('leadingTrailingSpaces')) return `Leading or trailing spaces are not allowed`;
    if (control.hasError('futureDate')) return `Date of birth cannot be in the future`;
    if (control.hasError('underage')) return `You must be at least 18 years old to register`;

    return 'Invalid field';
  }

  private formatFieldName(field: string): string {
    const fieldNames: {[key: string]: string} = {
      'fullName': 'Full name',
      'email': 'Email',
      'dob': 'Date of birth',
      'departmentId': 'Department',
      'gender': 'Gender'
    };
    
    return fieldNames[field] || field;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); 
      return;
    }

    this.busy = true;
    
    // Trimming the full name before submitting
    const formValue = this.form.getRawValue();
    const trimmedFullName = formValue.fullName.trim();
    
    // Calculating age from date of birth
    const dob = new Date(formValue.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    const payload: RegisterEmployeeRequest = {
      ...formValue,
      fullName: trimmedFullName, // Use trimmed name
      age: age
    };

    this.auth.registerEmployee(payload).subscribe({
      next: () => {
        this.toastr.success(
          'Registration submitted. Wait for admin approval.',
          'Success',
          { timeOut: 3000, closeButton: true, progressBar: true }
        );
        this.form.reset({
          fullName: '',
          email: '',
          dob: '',
          departmentId: 0,
          gender: 'Male'
        });
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Register failed');
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      }
    });
  }
}