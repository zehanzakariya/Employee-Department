import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environment/environment';
import { Department } from '../../../../core/models/dept.model';
import { Dept } from '../../../../core/services/dept.service';
import { Employee } from '../../../../core/services/employee.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { FileSizePipe } from '../../../../core/pipes/file-size-pipe';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { ErrorHandler } from '../../../../core/services/error-handler';

@Component({
  selector: 'app-employee-dialog',
  imports: [...UI_IMPORTS,MatCheckboxModule],
  templateUrl: './employee-dialog.html',
  styleUrl: './employee-dialog.scss'
})
export class EmployeeDialog {
  private deptService = inject(Dept);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private employeeService = inject(Employee);
  private http = inject(HttpClient);
  public dialogRef = inject(MatDialogRef<EmployeeDialog>);
  private errorHandler = inject(ErrorHandler);

  departments: Department[] = [];
  loading = false;
  apiUrl = environment.assetsUrl;


  readonly FULL_NAME_MAX_LENGTH = 100;
  readonly EMAIL_MAX_LENGTH = 150;
  readonly USERNAME_MAX_LENGTH = 50;
  readonly PHONE_MAX_LENGTH = 15;
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; 
  readonly ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  documentTypes = [
    { key: 'degreeCertificate', label: 'Degree Certificate', formControlName: 'DegreeCertificate' },
    { key: 'plusTwoCertificate', label: '+2 Certificate', formControlName: 'PlusTwoCertificate' },
    { key: 'sslCertificate', label: 'SSLC Certificate', formControlName: 'SSLCertificate' },
    { key: 'experienceCertificate', label: 'Experience Certificate', formControlName: 'ExperienceCertificate' },
    { key: 'passport', label: 'Passport', formControlName: 'Passport' },
    { key: 'aadhar', label: 'Aadhar Card', formControlName: 'Aadhar' }
  ];

  selectedFiles: { [key: string]: File } = {};

  form = this.fb.group({
    FullName: ['', [
      Validators.required,
      Validators.maxLength(this.FULL_NAME_MAX_LENGTH),
      Validators.pattern(/^[a-zA-Z\s.'-]+$/) 
    ]],
    Email: ['', [
      Validators.required, 
      Validators.email,
      Validators.maxLength(this.EMAIL_MAX_LENGTH)
    ]],
    Username: ['', [
      Validators.required,
      Validators.maxLength(this.USERNAME_MAX_LENGTH),
      // Validators.pattern(/^[a-zA-Z0-9._-]+$/)
    ]],
    DepartmentId: [null as number | null, Validators.required],
    PhoneNo: ['', [
      Validators.required,
      Validators.pattern(/^(\+\d{1,3})?\d{10,15}$/),
      Validators.maxLength(this.PHONE_MAX_LENGTH)
    ]],
    IsActive: [true],
    IsProfileCompleted: [false]
  });

  // methods for faster template access
  get fullName() { return this.form.get('FullName'); }
  get email() { return this.form.get('Email'); }
  get username() { return this.form.get('Username'); }
  get phoneNo() { return this.form.get('PhoneNo'); }
  get departmentId() { return this.form.get('DepartmentId'); }

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
    this.loadDepartments();

    if (this.data) {
      // Firstly iam patching the form without departmentId
      this.form.patchValue({
        FullName: this.data.fullName,
        Email: this.data.email,
        Username: this.data.username,
        PhoneNo: this.data.phoneNo || '',
        IsActive: this.data.isActive !== undefined ? this.data.isActive : true,
        IsProfileCompleted: this.data.isProfileCompleted !== undefined ? this.data.isProfileCompleted : false
      });

      // DepartmentId need to be set after departments are loaded
    } else {
      this.form.get('Email')?.valueChanges.subscribe(email => {
        if (email && !this.form.get('Username')?.value) {
          this.form.get('Username')?.setValue(email);
        }
      });
    }
  }

  loadDepartments() {
    this.deptService.list().subscribe({
      next: (depts) => {
        this.departments = depts;
        
        // After departments are loaded, finding the department ID by name
        if (this.data && this.data.departmentName) {
          const department = this.departments.find(dept => 
            dept.departmentName === this.data.departmentName
          );
          
          if (department) {
            this.form.get('DepartmentId')?.setValue(department.departmentId);
          } else {
            console.warn('Department not found:', this.data.departmentName);
            this.toastr.warning(
              `Department "${this.data.departmentName}" not found in available departments`,
              'Department Warning',
              { timeOut: 4000 }
            );
          }
        }
      },
      error: () => {
        this.toastr.error('Failed to load departments', 'Error', {
          timeOut: 3000,
          closeButton: true,
          progressBar: true
        });
      }
    });
  }

  getDocumentPath(documentKey: string): string | null {
    return this.data?.[documentKey + 'Path'] || null;
  }

  getFullDocumentPath(path: string): string {
    if (!path) return '';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.apiUrl}/${cleanPath}`;
  }

  isImageFile(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerPath = path.toLowerCase();
    return imageExtensions.some(ext => lowerPath.endsWith(ext));
  }

  onFileSelected(event: any, documentKey: string) {
    const file = event.target.files[0];
    if (file) {
      if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
        this.toastr.warning('Please select a valid file (PDF, DOC, DOCX, JPEG, PNG, GIF, WEBP)', 'Invalid File Type', {
          timeOut: 4000,
          closeButton: true,
          progressBar: true
        });
        event.target.value = '';
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.toastr.warning('File size must be less than 5MB', 'File Too Large', {
          timeOut: 3000,
          closeButton: true,
          progressBar: true
        });
        event.target.value = '';
        return;
      }
      
      this.selectedFiles[documentKey] = file;
      this.toastr.success(`${file.name} selected successfully`, 'File Selected', {
        timeOut: 2000,
        closeButton: true,
        progressBar: true
      });
      event.target.value = '';
    }
  }

  removeSelectedFile(documentKey: string) {
    const fileName = this.selectedFiles[documentKey]?.name || 'file';
    delete this.selectedFiles[documentKey];
    this.toastr.info(`${fileName} removed`, 'File Removed', {
      timeOut: 2000,
      closeButton: true,
      progressBar: true
    });
  }

  viewDocument(path: string, title: string) {
    if (!path) {
      this.toastr.warning('No document available to view', 'No Document', {
        timeOut: 3000,
        closeButton: true,
        progressBar: true
      });
      return;
    }
    
    const fullPath = this.getFullDocumentPath(path);
    window.open(fullPath, '_blank');
  }

  private extractFilenameFromPath(path: string): string {
    try {
      const pathParts = path.split('/');
      const filenameWithExtension = pathParts[pathParts.length - 1];
      const filename = filenameWithExtension.split('?')[0];
      return filename;
    } catch (e) {
      console.error('Error extracting filename from path:', e);
      return '';
    }
  }

  downloadDocument(path: string, title: string) {
    if (!path) {
      this.toastr.warning('No document available to download', 'No Document', {
        timeOut: 3000,
        closeButton: true,
        progressBar: true
      });
      return;
    }
    
    const fullPath = this.getFullDocumentPath(path);
    
    this.http.get(fullPath, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        
        const filename = this.extractFilenameFromPath(path) || `${title.replace(/\s+/g, '_')}`;
        let fileExtension = this.getFileExtensionFromBlob(blob) || this.getFileExtensionFromPath(path) || '';
        
        link.download = `${filename}${fileExtension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(blobUrl);
        
        this.toastr.success(`Downloading ${title}`, 'Download Started', {
          timeOut: 2000,
          closeButton: true,
          progressBar: true
        });
      },
      error: (error) => {
        console.error('Download error:', error);
        this.downloadWithDirectLink(fullPath, title, path);
      }
    });
  }
  
  private getFileExtensionFromBlob(blob: Blob): string {
    const type = blob.type;
    if (type === 'image/jpeg') return '.jpg';
    if (type === 'image/png') return '.png';
    if (type === 'image/gif') return '.gif';
    if (type === 'application/pdf') return '.pdf';
    if (type === 'application/msword') return '.doc';
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
    return '';
  }
  
  private getFileExtensionFromPath(path: string): string {
    try {
      const lastDotIndex = path.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        return path.substring(lastDotIndex);
      }
      return '';
    } catch (e) {
      return '';
    }
  }
  
  private downloadWithDirectLink(fullPath: string, title: string, path: string) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = fullPath;
    
    iframe.onload = () => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = fullPath;
        const fileExtension = this.getFileExtensionFromPath(path) || '';
        link.download = `${title.replace(/\s+/g, '_')}${fileExtension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        document.body.removeChild(iframe);
      }, 1000);
    };
    
    document.body.appendChild(iframe);
    
    this.toastr.success(`Downloading ${title}`, 'Download Started', {
      timeOut: 2000,
      closeButton: true,
      progressBar: true
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fix all validation errors before submitting', 'Form Validation Error', {
        timeOut: 4000,
        closeButton: true,
        progressBar: true
      });
      return;
    }
  
    this.loading = true;
    const formValue = this.form.getRawValue();
    
    const formData = new FormData();
    
    formData.append('FullName', formValue.FullName?.trim() || '');
    formData.append('Email', formValue.Email?.trim() || '');
    formData.append('Username', formValue.Username?.trim() || '');
    formData.append('DepartmentId', formValue.DepartmentId?.toString() || '');
    formData.append('PhoneNo', formValue.PhoneNo?.trim() || '');
    formData.append('IsActive', formValue.IsActive?.toString() || 'true');
    formData.append('IsProfileCompleted', formValue.IsProfileCompleted?.toString() || 'false');
  
    Object.keys(this.selectedFiles).forEach(key => {
      formData.append(key, this.selectedFiles[key]);
    });
  
    const request = this.data
      ? this.employeeService.update(this.data.employeeId, formData)
      : this.employeeService.create(formData);
  
    request.subscribe({
      next: (response) => {
        this.toastr.success(
          `Employee ${this.data ? 'updated' : 'added'} successfully!`,
          'Success',
          { 
            timeOut: 3000,
            closeButton: true,
            progressBar: true
          }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Employee editing  failed');
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }
}