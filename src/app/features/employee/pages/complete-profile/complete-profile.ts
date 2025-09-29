import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { EmployeeReadDto } from '../../../../core/models/employee.model';
import { Auth } from '../../../../core/services/auth.service';
import { Dept } from '../../../../core/services/dept.service';
import { Employee } from '../../../../core/services/employee.service';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';

interface Department {
  departmentId: number;
  departmentName: string;
}

@Component({
  selector: 'app-complete-profile',
  imports: [...UI_IMPORTS],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.scss'
})
export class CompleteProfile {
  private fb = inject(FormBuilder);
  private employeeService = inject(Employee);
  private deptService = inject(Dept);
  private auth = inject(Auth);
  private router = inject(Router);
  private snackbar = inject(MatSnackBar);

  loading = false;
  departments: Department[] = [];
  selectedFiles: { [key: string]: File } = {};
  employeeId?: number;
  employeeDepartmentId?: number;
  isProfileAlreadyCompleted = false;
  
  form: FormGroup = this.fb.group({
    FullName: ['', [Validators.required, Validators.minLength(3)]],
    Email: [{ value: this.auth.user?.email || '', disabled: true }],
    PhoneNo: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    DepartmentId: ['', Validators.required],
    Username: [this.auth.user?.email || ''],
    IsProfileCompleted: [true], 
    IsActive: [true]
  });

  ngOnInit() {
    this.loadDepartments();
    this.loadExistingData();
  }

  loadDepartments() {
    this.deptService.list().subscribe({
      next: (depts: any[]) => {
        this.departments = depts.map(dept => ({
          departmentId: dept.departmentId,
          departmentName: dept.departmentName
        }));
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
        this.snackbar.open('Failed to load departments', 'Close', { duration: 3000 });
      }
    });
  }

  loadExistingData() {
    this.employeeService.me().subscribe({
      next: (data: EmployeeReadDto[]) => {
        if (data && data.length > 0) {
          const employeeData = data.find(emp => emp.email === this.auth.user?.email);
          
          if (employeeData) {
            this.processEmployeeData(employeeData);
          } else {
            this.snackbar.open('Employee data not found', 'Close', { duration: 3000 });
          }
        }
      },
      error: (error) => {
        console.error('Failed to load employee data:', error);
        this.snackbar.open('Failed to load profile data', 'Close', { duration: 3000 });
      }
    });
  }

  private processEmployeeData(employeeData: EmployeeReadDto) {
    this.employeeId = employeeData.employeeId;
    
    // Checking if profile is already completed
    if (employeeData.isProfileCompleted) {
      this.isProfileAlreadyCompleted = true;
      this.auth.updateLocalUser({ 
        profileComplete: true,
        fullName: employeeData.fullName,
        departmentName: employeeData.departmentName
      } as any);
      
      this.snackbar.open('Your profile is already completed', 'Close', { duration: 3000 });
      this.router.navigate(['/employee/task-view']);
      return;
    }
    
    // Finding department ID from department name
    let departmentId: number | undefined;
    if (employeeData.departmentName && this.departments.length > 0) {
      const department = this.departments.find(dept => 
        dept.departmentName.toLowerCase() === employeeData.departmentName.toLowerCase()
      );
      departmentId = department?.departmentId;
    }
    
    this.form.patchValue({
      FullName: employeeData.fullName || '',
      PhoneNo: employeeData.phoneNo || '',
      DepartmentId: departmentId?.toString() || '',
      Username: employeeData.username || this.auth.user?.email || '',
      IsProfileCompleted: true,
      IsActive: employeeData.isActive !== false
    });
  }

  getDepartmentName(departmentId: string): string {
    if (!departmentId || !this.departments.length) return 'Loading department...';
    
    const department = this.departments.find(dept => 
      dept.departmentId.toString() === departmentId
    );
    
    return department ? department.departmentName : 'Department not assigned';
  }

  onFileSelected(event: any, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.snackbar.open('Please select a PDF, JPG, or PNG file', 'Close', { duration: 3000 });
        input.value = '';
        return;
      }
      
      // Maximum 5MB
      if (file.size > 5 * 1024 * 1024) {
        this.snackbar.open('File size should be less than 5MB', 'Close', { duration: 3000 });
        input.value = '';
        return;
      }
      
      this.selectedFiles[fieldName] = file;
      
      // Showing file name feedback
      this.snackbar.open(`${file.name} selected`, 'Close', { duration: 2000 });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    if (this.isProfileAlreadyCompleted) {
      this.snackbar.open('Profile is already completed', 'Close', { duration: 3000 });
      this.router.navigate(['/employee/task-view']);
      return;
    }

    // Checking if all required documents are uploaded
    const requiredDocs = ['DegreeCertificate', 'PlusTwoCertificate', 'SSLCertificate', 'Passport', 'Aadhar'];
    const missingDocs = requiredDocs.filter(doc => !this.selectedFiles[doc]);
    
    if (missingDocs.length > 0) {
      this.snackbar.open(`Please upload all required documents: ${missingDocs.join(', ')}`, 'Close', { duration: 5000 });
      return;
    }

    if (!this.employeeId) {
      this.snackbar.open('Employee ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    const formData = new FormData();
    const formValue = this.form.getRawValue();
    
    // Appending all form values including profile completion status
    Object.keys(formValue).forEach((key: string) => {
      const value = formValue[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Ensuring main fields are set
    formData.append('IsProfileCompleted', 'true');
    formData.append('IsActive', 'true');

    // Appending files with EXACT API field names
    Object.keys(this.selectedFiles).forEach(key => {
      formData.append(key, this.selectedFiles[key]);
    });

    console.log('Submitting profile data with employee ID:', this.employeeId);
    console.log('Form data keys:', Array.from(formData.keys()));

    this.employeeService.update(this.employeeId, formData).subscribe({
      next: (response: any) => {
        console.log('Profile completion response:', response);
        
        // Updating local user session
        this.auth.updateLocalUser({ 
          profileComplete: true,
          fullName: response.fullName || formValue.FullName,
          departmentName: response.departmentName || this.getDepartmentName(formValue.DepartmentId),
          isActive: true
        } as any);

        this.snackbar.open('Profile completed successfully! You can now access all features.', 'Close', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });

        // Redirecting to dashboard
        setTimeout(() => {
          this.router.navigate(['/employee/task-view']);
        }, 1000);
      },
      error: (error) => {
        console.error('Profile completion error:', error);
        
        let errorMsg = 'Failed to complete profile. Please try again.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error.title) {
            errorMsg = error.error.title;
          }
        }
        
        this.snackbar.open(errorMsg, 'Close', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  getUploadedDocumentCount(): number {
    const requiredDocs = ['DegreeCertificate', 'PlusTwoCertificate', 'SSLCertificate', 'Passport', 'Aadhar'];
    return requiredDocs.filter(doc => this.selectedFiles[doc]).length;
  }


  getTotalRequiredDocuments(): number {
    return 5; 
  }
}