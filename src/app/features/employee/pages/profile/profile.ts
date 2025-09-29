import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EmployeeReadDto } from '../../../../core/models/employee.model';
import { Auth } from '../../../../core/services/auth.service';
import { Dept } from '../../../../core/services/dept.service';
import { Employee } from '../../../../core/services/employee.service';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { DocumentViewerDialog } from '../../../admin/pages/document-viewer-dialog/document-viewer-dialog';

interface Department {
  departmentId: number;
  departmentName: string;
}
@Component({
  selector: 'app-profile',
  imports: [UI_IMPORTS],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {
  private fb = inject(FormBuilder);
  private employeeService = inject(Employee);
  private deptService = inject(Dept);
  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private errorHandler = inject(ErrorHandler);
  private toastr = inject(ToastrService);

  loading = false;
  profileLoading = false;
  passwordLoading = false;
  departments: Department[] = [];
  employeeData: EmployeeReadDto | null = null; 
  selectedFiles: { [key: string]: File } = {};
  
  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: [{ value: '', disabled: true }],
    username: ['', Validators.required],
    phoneNo: ['', [Validators.pattern(/^\d{10}$/)]],
    departmentId: ['', Validators.required]
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.loadDepartments();
    this.loadEmployeeProfile();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  loadDepartments() {
    this.deptService.list().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'Failed to load departments');
      }
    });
  }

  loadEmployeeProfile() {
    this.profileLoading = true;
    this.employeeData = null;
    
    if (this.auth.user?.employeeId) {
      this.employeeService.getById(this.auth.user.employeeId).subscribe({
        next: (employeeData: EmployeeReadDto) => {
          this.employeeData = employeeData;
          this.populateForm(employeeData);
        },
        error: (error) => {
          this.errorHandler.handleError(error, 'Failed to load profile data');
          this.profileLoading = false;
        },
        complete: () => {
          this.profileLoading = false;
        }
      });
    } else {
      this.employeeService.me().subscribe({
        next: (data: EmployeeReadDto[]) => {
          if (data && data.length > 0) {
            const employeeData = data.find(emp => emp.email === this.auth.user?.email);
            
            if (employeeData) {
              this.employeeData = employeeData;
              this.populateForm(employeeData);
            } else {
              this.toastr.error('Employee data not found', 'Error');
            }
          } else {
            this.toastr.error('No employee data available', 'Error');
          }
        },
        error: (error) => {
          this.errorHandler.handleError(error, 'Failed to load profile data');
          this.profileLoading = false;
        },
        complete: () => {
          this.profileLoading = false;
        }
      });
    }
  }

  private populateForm(employeeData: EmployeeReadDto) {
    this.profileForm.patchValue({
      fullName: employeeData.fullName || '',
      email: employeeData.email || '',
      username: employeeData.username || '',
      phoneNo: employeeData.phoneNo || '',
      departmentId: employeeData.departmentId?.toString() || ''
    });
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.toastr.warning('Please select a PDF, JPG, or PNG file', 'Invalid File Type');
        event.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.warning('File size should be less than 5MB', 'File Too Large');
        event.target.value = '';
        return;
      }
      
      this.selectedFiles[fieldName] = file;
    }
  }

  viewDocuments() {
    if (!this.employeeData) {
      this.toastr.warning('No employee data available', 'Error');
      return;
    }

    const documents = [
      { name: 'Degree Certificate', path: this.employeeData.degreeCertificatePath },
      { name: '+2 Certificate', path: this.employeeData.plusTwoCertificatePath },
      { name: 'SSLC Certificate', path: this.employeeData.sslCertificatePath },
      { name: 'Experience Certificate', path: this.employeeData.experienceCertificatePath },
      { name: 'Passport', path: this.employeeData.passportPath },
      { name: 'Aadhar', path: this.employeeData.aadharPath }
    ].filter(doc => doc.path);

    if (documents.length === 0) {
      this.toastr.warning('No documents available for this employee', 'No Documents');
      return;
    }

    this.dialog.open(DocumentViewerDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: {
        employeeName: this.employeeData.fullName,
        documents: documents
      }
    });
  }

  updateProfile() {
    if (!this.employeeData) {
      this.toastr.error('Employee data not available', 'Error');
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastr.error('Please fix all validation errors', 'Validation Error');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    const formValue = this.profileForm.getRawValue();
    
    Object.keys(formValue).forEach((key: string) => {
      const value = formValue[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    Object.keys(this.selectedFiles).forEach(key => {
      formData.append(key, this.selectedFiles[key]);
    });

    this.employeeService.update(this.employeeData.employeeId, formData).subscribe({
      next: (response: any) => {
        this.toastr.success('Profile updated successfully!', 'Success');
        
        this.auth.updateLocalUser({ 
          fullName: response.fullName,
          departmentName: response.departmentName
        } as any);

        this.loadEmployeeProfile();
        this.selectedFiles = {};
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'Failed to update profile. Please try again.');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.toastr.error('New passwords do not match', 'Validation Error');
      } else {
        this.toastr.error('Please fill all password fields correctly', 'Validation Error');
      }
      return;
    }

    this.passwordLoading = true;
    const passwordData = this.passwordForm.value;

    this.employeeService.changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    }).subscribe({
      next: () => {
        this.toastr.success('Password changed successfully!', 'Success');
        this.passwordForm.reset();
      },
      error: (error) => {
        this.errorHandler.handleError(error, 'Failed to change password. Please try again.');
        this.passwordLoading = false;
      },
      complete: () => {
        this.passwordLoading = false;
      }
    });
  }

  getDocumentCount(): number {
    if (!this.employeeData) return 0;
    
    const documents = [
      this.employeeData.degreeCertificatePath,
      this.employeeData.plusTwoCertificatePath,
      this.employeeData.sslCertificatePath,
      this.employeeData.experienceCertificatePath,
      this.employeeData.passportPath,
      this.employeeData.aadharPath
    ];
    return documents.filter(doc => doc !== null && doc !== '').length;
  }
}