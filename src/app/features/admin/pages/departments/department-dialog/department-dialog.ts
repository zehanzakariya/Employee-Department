import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogContent, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environment/environment';
import { Department } from '../../../../../core/models/dept.model';
export function firstTwoLettersValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || value.length < 2) {
      return null; 
    }
    
    const firstTwoChars = value.substring(0, 2);
    const lettersRegex = /^[A-Za-z]{2}$/;
    
    if (!lettersRegex.test(firstTwoChars)) {
      return { firstTwoLetters: true };
    }
    
    return null;
  };
}

// Custom validator for letters and spaces only
export function lettersAndSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; 
    }
    
    const lettersSpacesRegex = /^[A-Za-z\s]*$/;
    
    if (!lettersSpacesRegex.test(value)) {
      return { pattern: true };
    }
    
    return null;
  };
}
@Component({
  selector: 'app-department-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './department-dialog.html',
  styleUrl: './department-dialog.scss'
})
export class DepartmentDialog {
  form: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  private apiUrl = environment.assetsUrl.replace('/api', '');

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DepartmentDialog>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Department | null
  ) {
    this.form = this.fb.group({
      departmentName: [
        data?.departmentName || '', 
        [
          Validators.required, 
          Validators.minLength(2), 
          Validators.maxLength(100),
          lettersAndSpacesValidator(),
          firstTwoLettersValidator()
        ]
      ],
      description: [
        data?.description || '', 
        [Validators.maxLength(500)]
      ],
      headOfDepartment: [
        data?.headOfDepartment || '', 
        [
          Validators.required, 
          Validators.minLength(2), 
          Validators.maxLength(100),
          lettersAndSpacesValidator(),
          firstTwoLettersValidator()
        ]
      ],
      status: [
        data?.status || 'Active', 
        Validators.required
      ]
    });

    // Setting the preview URL with image path 
    if (data?.imagePath) {
      this.previewUrl = this.getFullImagePath(data.imagePath); 
    }
  }

  // Method for getting full image path
  private getFullImagePath(imagePath: string): string {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Removing the leading slash to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Constructing full URL
    return `${this.apiUrl}/${cleanPath}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = e => (this.previewUrl = reader.result);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearFile() {
    this.selectedFile = null;
    // Restoring original image if it exists
    this.previewUrl = this.data?.imagePath ? this.getFullImagePath(this.data.imagePath) : null;
    
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.snackBar.open('File selection cleared', 'Close', { duration: 2000 });
  }

  downloadImage() {
    if (!this.data?.imagePath) {
      this.snackBar.open('No image available to download', 'Close', { duration: 3000 });
      return;
    }

    const imageUrl = this.getFullImagePath(this.data.imagePath);

    const link = document.createElement('a');
    link.href = imageUrl;
    
    const filename = this.getFilenameFromUrl(imageUrl) || `department-${this.data.departmentName}.jpg`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getFilenameFromUrl(url: string | undefined): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1);
    } catch (e) {
      console.error('Error parsing URL:', e);
      return '';
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = new FormData();
      
      formData.append('DepartmentId', this.data?.departmentId?.toString() || '0');
      formData.append('DepartmentName', this.form.get('departmentName')?.value || '');
      formData.append('Description', this.form.get('description')?.value || '');
      formData.append('HeadOfDepartment', this.form.get('headOfDepartment')?.value || '');
      formData.append('Status', this.form.get('status')?.value || 'Active');
      
      // Handling ImagePath - sending the original image path if no new file is selected
      if (this.data?.imagePath && !this.selectedFile) {
        formData.append('ImagePath', this.data.imagePath);
      } else {
        formData.append('ImagePath', ''); 
      }
      
      if (this.selectedFile) {
        formData.append('imageFile', this.selectedFile);
      }

      this.dialogRef.close(formData);
    } else {
      this.form.markAllAsTouched();
      this.snackBar.open('Please fix the validation errors', 'Close', { duration: 3000 });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}